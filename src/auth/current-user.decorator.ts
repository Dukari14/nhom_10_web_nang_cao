import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './jwt-auth.guard';

// Lấy user_id của người đang đăng nhập (JwtAuthGuard đã gắn vào request)
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user.sub,
);
