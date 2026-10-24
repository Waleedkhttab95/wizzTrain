import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser, LoginResponse } from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

/**
 * Decorator metadata is evaluated at class-definition time, before the DI
 * container exists, so this is the one place that reads process.env directly
 * rather than going through ConfigService. The values are still validated by
 * the Joi schema at boot.
 */
const LOGIN_RATE_LIMIT = Number(process.env.LOGIN_RATE_LIMIT ?? 5);
const LOGIN_RATE_TTL_MS = Number(process.env.LOGIN_RATE_TTL_MS ?? 60_000);

@ApiTags('auth')
@ApiStandardErrors()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Tighter limit than the global one: login is the credential-stuffing target. */
  @Public()
  @ApiOperation({
    summary: 'Log in as a trainer or a client',
    description:
      'Resolves the email against both account tables and returns a JWT carrying the role. No bearer token is required.',
  })
  @Throttle({ default: { limit: LOGIN_RATE_LIMIT, ttl: LOGIN_RATE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  /**
   * Rate-limited like login: both endpoints take a password and tell the
   * caller whether it was right, so both are worth guessing against.
   */
  @ApiOperation({
    summary: 'Change your own password',
    description:
      'Works for either role. Requires the current password as well as the bearer token, and returns no body.',
  })
  @ApiBearerAuth('bearer')
  @Throttle({ default: { limit: LOGIN_RATE_LIMIT, ttl: LOGIN_RATE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user, dto);
  }

  /** Lets the web app restore a session on reload without decoding the JWT itself. */
  @ApiOperation({ summary: 'The caller identity behind the current token' })
  @ApiBearerAuth('bearer')
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
