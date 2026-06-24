import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { StudentService } from '../services/student.service';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { ConsentQueryDto } from '../dto/consent-query.dto';
import { ConsentInfoBodyDto } from '../dto/consent-info-body.dto';

@Controller('v1/students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard, GoogleAuthGuard)
  @Get('/auth/google/login')
  googleLogin() {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard, GoogleAuthGuard)
  @Get('/auth/google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const { redirectUrl } =
      await this.studentService.handleGoogleOAuthCallback(req.user);
    return res.redirect(redirectUrl);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard)
  @Get('/auth/consent')
  async showConsentPage(@Query() dto: ConsentQueryDto, @Res() res) {
    return res.redirect(
      `${this.configService.get<string>('STUDENT_URL')}/oauth/consent?token=${dto.token}`,
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard)
  @Get('/auth/consent/info')
  async getConsentInfo(@Query('token') token: string) {
    return this.studentService.getConsentUserInfo(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard)
  @Post('/auth/consent')
  async handleConsent(@Body() consentInfo: ConsentInfoBodyDto) {
    return this.studentService.handleConsentSubmission(
      consentInfo.consent,
      consentInfo.token,
    );
  }
}
