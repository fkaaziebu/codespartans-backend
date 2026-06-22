import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'test-secret',
    });
  }

  async validate(payload: any) {
    if (payload.type === 'pending_deletion') {
      return { ...payload, is_pending_deletion: true };
    }
    const isDeactivated = await this.cacheManager.get(
      `deactivated:${payload.id}`,
    );
    if (isDeactivated) {
      throw new UnauthorizedException('Account has been deactivated');
    }
    const pwChanged = await this.cacheManager.get(`pw_changed:${payload.id}`);
    if (pwChanged && payload.iat < Number(pwChanged)) {
      throw new UnauthorizedException(
        'Password was recently changed. Please log in again.',
      );
    }
    const loggedOut = await this.cacheManager.get(`logged_out:${payload.id}`);
    if (loggedOut && payload.iat <= Number(loggedOut)) {
      throw new UnauthorizedException('Logged out. Please log in again.');
    }
    return payload;
  }
}
