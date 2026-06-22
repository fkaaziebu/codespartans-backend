import {
  Body,
  Controller,
  Get,
  Inject,
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
import { AccountStatus } from '../types/account-deletion-response.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EmailProducer } from '../services/email.producer';

@Controller('v1/students')
export class StudentController {
  private readonly gracePeriodMs: number;
  constructor(
    private readonly studentService: StudentService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly emailProducer: EmailProducer,
  ) {
    this.gracePeriodMs =
      this.configService.get<number>('ACCOUNT_DELETION_GRACE_DAYS') *
      24 *
      60 *
      60 *
      1000;
  }

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

    if (!user.is_account_validated) {
      return res.redirect(
        `${this.configService.get<string>('STUDENT_URL')}/validate-account?email=${user.email}`,
      );
    }

    if (user.is_deactivated) {
      const deletionScheduledFor = new Date(
        new Date(user.deactivated_at).getTime() + this.gracePeriodMs,
      );
      const pendingToken = this.jwtService.sign(
        {
          id: user.id,
          role: 'STUDENT',
          type: 'pending_deletion',
        },
        { expiresIn: '15m' },
      );

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.cacheManager.set(`cancel_otp:${user.id}`, otp, 10 * 60 * 1000);
      await this.emailProducer.sendCancellationOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });

      res.redirect(
        `${this.configService.get<string>('STUDENT_URL')}/oauth/redirect?token=${pendingToken}&organizationId=${user.organizations.at(0).id}&isSetupCompleted=${Boolean(user.is_setup_completed)}&accountStatus=${AccountStatus.PENDING_DELETION}&deletionScheduledFor=${deletionScheduledFor}`,
      );
    }

    const payload: {
      id: string;
      role: 'STUDENT';
    } = {
      id: user.id,
      role: 'STUDENT',
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24}h` },
    );

    res.redirect(
      `${this.configService.get<string>('STUDENT_URL')}/oauth/redirect?token=${access_token}&refreshToken=${refresh_token}&organizationId=${user.organizations.at(0).id}&isSetupCompleted=${Boolean(user.is_setup_completed)}`,
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
      const payload = await this.studentService.createGoogleUser(consentData);

      return {
        redirectUrl: `${this.configService.get<string>('STUDENT_URL')}/validate-account?email=${payload.email}`,
      };
    }

    return {
      redirectUrl: `${this.configService.get<string>('STUDENT_URL')}/oauth/failed`,
    };
  }
}
