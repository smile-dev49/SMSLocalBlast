import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

interface RequestWithUser {
  readonly user?: unknown;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user;
  },
);
