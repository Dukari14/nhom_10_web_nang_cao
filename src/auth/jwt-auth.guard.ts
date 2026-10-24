import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { AUTH_COOKIE_NAME, JwtPayload } from './auth.constants';

export type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    let payload: JwtPayload;
    try {
      // Kiểm tra chữ ký và hạn của token
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      const expired = (error as { name?: string })?.name === 'TokenExpiredError';
      throw new UnauthorizedException(
        expired
          ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
          : 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
      );
    }

    // Đọc lại user từ DB để việc khóa tài khoản, xóa tài khoản hay đổi role có hiệu lực ngay,
    // không phải chờ token cũ hết hạn
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub },
      select: { user_id: true, email: true, role: true, is_active: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại, vui lòng đăng nhập lại');
    }
    if (!user.is_active) {
      throw new ForbiddenException('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên');
    }

    request.user = { sub: user.user_id, email: user.email, role: user.role };
    return true;
  }
}
