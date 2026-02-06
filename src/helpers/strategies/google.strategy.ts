import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { StudentService } from '../../modules/auth/services/student.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private studentService: StudentService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = await this.studentService.validateGoogleUser({
      email: profile.emails[0].value,
      password: '',
    });

    if (!user) {
      const consentData = {
        email: profile.emails[0].value,
        firstName: profile.name.givenName ? profile.name.givenName : '',
        lastName: profile.name.familyName ? profile.name.familyName : '',
        accessToken,
        refreshToken,
      };

      return done(null, { needsConsent: true, consentData });
    }

    done(null, user);
  }
}
