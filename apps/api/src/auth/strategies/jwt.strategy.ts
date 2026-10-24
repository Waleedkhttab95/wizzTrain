import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@wizzapp/shared';
import type { AuthenticatedUser, JwtPayload } from '@wizzapp/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../config/auth.config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY) config: ConfigType<typeof authConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  /**
   * Runs on every guarded request. The signature is already verified here, but
   * we still re-read the account so a deleted client loses access immediately
   * rather than at token expiry.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || (payload.role !== Role.Trainer && payload.role !== Role.Client)) {
      throw new UnauthorizedException('رمز الدخول غير صالح');
    }
    return this.authService.validatePayload(payload);
  }
}
