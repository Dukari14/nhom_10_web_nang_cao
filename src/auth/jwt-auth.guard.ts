import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_COOKIE_NAME, JwtPayload } from './auth.constants';

export type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    try {
      // Kiểm tra chữ ký và hạn của token, gắn thông tin user vào request
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }
    return true;
  }
}
