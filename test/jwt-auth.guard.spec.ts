import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { UserRole } from '../src/user/user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let userRepository: { findOne: jest.Mock };

  const contextWith = (cookies?: Record<string, string>) => {
    const request: any = { cookies };
    return { request, context: { switchToHttp: () => ({ getRequest: () => request }) } as any };
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', email: 'cu@test.com', role: UserRole.CUSTOMER }) };
    userRepository = {
      findOne: jest.fn().mockResolvedValue({ user_id: 'u1', email: 'a@test.com', role: UserRole.ADMIN, is_active: true }),
    };
    guard = new JwtAuthGuard(jwtService as any, userRepository as any);
  });

  it('báo lỗi 401 khi không có cookie', async () => {
    const { context } = contextWith({});

    await expect(guard.canActivate(context)).rejects.toThrow('Bạn chưa đăng nhập');
  });

  it('báo lỗi 401 riêng cho token hết hạn', async () => {
    jwtService.verifyAsync.mockRejectedValue(Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' }));
    const { context } = contextWith({ access_token: 'het-han' });

    await expect(guard.canActivate(context)).rejects.toThrow('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  });

  it('báo lỗi 401 khi token sai chữ ký, không lộ lý do kỹ thuật', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    const { context } = contextWith({ access_token: 'gia-mao' });

    const error = await guard.canActivate(context).catch((e) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.message).not.toContain('signature');
  });

  it('báo lỗi 401 khi tài khoản đã bị xóa', async () => {
    userRepository.findOne.mockResolvedValue(null);
    const { context } = contextWith({ access_token: 'ok' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('báo lỗi 403 khi tài khoản bị khóa, dù token còn hạn', async () => {
    userRepository.findOne.mockResolvedValue({ user_id: 'u1', email: 'a@test.com', role: UserRole.CUSTOMER, is_active: false });
    const { context } = contextWith({ access_token: 'ok' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('lấy role từ DB chứ không tin role trong token (đổi role có hiệu lực ngay)', async () => {
    const { context, request } = contextWith({ access_token: 'ok' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 'u1', email: 'a@test.com', role: UserRole.ADMIN });
  });
});
