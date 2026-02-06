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
import { StudentService } from '../services/student.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { ConsentQueryDto } from '../dto/consent-query.dto';
import { ConsentInfoBodyDto } from '../dto/consent-info-body.dto';

@Controller('v1/students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @UseGuards(GoogleAuthGuard)
  @Get('/auth/google/login')
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('/auth/google/callback')
  async googleCallback(@Req() req, @Res() res) {
    if (req.user.needsConsent) {
      // Redirect to consent page
      return res.redirect(
        `/v1/students/auth/consent?email=${req.user.consentData.email}&firstName=${req.user.consentData.firstName}&lastName=${req.user.consentData.lastName}`,
      );
    }

    const { user } = req;

    const payload: {
      id: string;
      name: string;
      email: string;
      role: 'STUDENT';
    } = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'STUDENT',
    };

    const access_token = this.jwtService.sign(payload);

    res.redirect(
      `${this.configService.get<string>('STUDENT_URL')}/oauth/redirect?token=${access_token}&organizationId=${user.organizations.at(0).id}`,
    );
  }

  @Get('/auth/consent')
  async showConsentPage(@Query() consentQueryDto: ConsentQueryDto, @Res() res) {
    // Render or redirect to frontend consent page with data

    return res.redirect(
      `${this.configService.get<string>('STUDENT_URL')}/oauth/consent?email=${consentQueryDto.email}&firstName=${consentQueryDto.firstName}&lastName=${consentQueryDto.lastName}`,
    );
  }

  @Post('/auth/consent')
  async handleConsent(@Body() consentInfo: ConsentInfoBodyDto) {
    const { consent, ...consentData } = consentInfo;

    if (consent === 'yes') {
      // Create new user account
      const payload = await this.studentService.createGoogleUser(consentData);

      // Generate JWT
      const access_token = this.jwtService.sign(payload);

      return {
        redirectUrl: `${this.configService.get<string>('STUDENT_URL')}/oauth/redirect?token=${access_token}&organizationId=${payload.organizationId}`,
      };
    }

    return {
      redirectUrl: `${this.configService.get<string>('STUDENT_URL')}/oauth/failed`,
    };
  }
}
