import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY } from '../constants/auth.constants';

/**
 * JWT guard — use explicitly on routes once login/token issuance exists (Prompt 3).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY) {}
