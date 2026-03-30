import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { RegisterBodySchema, type RegisterBody } from './dto/register.schema';
import { LoginBodySchema, type LoginBody } from './dto/login.schema';
import { RefreshBodySchema, type RefreshBody } from './dto/refresh.schema';
import { SessionIdParamSchema } from './dto/session-id.schema';
import type { MeResponse } from './types/me-response.types';
import type { SafeSession } from '../sessions/sessions.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register: creates initial organization owner' })
  async register(
    @Body(new ZodValidationPipe(RegisterBodySchema)) body: RegisterBody,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email/password' })
  async login(
    @Body(new ZodValidationPipe(LoginBodySchema)) body: LoginBody,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Body(new ZodValidationPipe(RefreshBodySchema))
    body: RefreshBody,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.refresh(body.refreshToken);
  }

  @Permissions('auth.logout')
  @ApiBearerAuth('access-token')
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 204 })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthPrincipal): Promise<void> {
    await this.auth.logout(user);
  }

  @Permissions('auth.logout_all')
  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all other sessions' })
  async logoutAll(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<{ keptSessionId: string; revokedSessionIds: string[] }> {
    return this.auth.logoutAll(user);
  }

  @Permissions('auth.me.read')
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile + org context' })
  async me(@CurrentUser() user: AuthPrincipal): Promise<MeResponse> {
    return this.auth.me(user);
  }

  @Permissions('auth.sessions.read')
  @ApiBearerAuth('access-token')
  @Get('sessions')
  @ApiOperation({ summary: 'List current user sessions' })
  async listSessions(@CurrentUser() user: AuthPrincipal): Promise<{ sessions: SafeSession[] }> {
    return this.auth.listSessions(user);
  }

  @Permissions('auth.sessions.revoke')
  @ApiBearerAuth('access-token')
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke one session (owned by current user)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser() user: AuthPrincipal,
    @Param('sessionId', new ZodValidationPipe(SessionIdParamSchema))
    sessionId: string,
  ): Promise<void> {
    await this.auth.revokeSession(user, sessionId);
  }
}
