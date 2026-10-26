import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { User, UserRole } from '../src/user/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOneBy: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  const registerDto = {
    email: 'nguyenvana@gmail.com',
    password: 'matkhau123',
    full_name: 'Nguyễn Văn A',
  };

  beforeEach(() => {
    // Giả lập repository và JwtService để test không cần database thật
    userRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (user) => ({ ...user, user_id: 'uuid-1' })),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('fake-jwt-token') };
    service = new AuthService(userRepository as any, jwtService as unknown as JwtService);
  });

  describe('register', () => {
    it('đăng ký thành công: băm mật khẩu, role customer, không trả password_hash', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.register(registerDto);

      const savedUser = userRepository.create.mock.calls[0][0] as User;
      expect(savedUser.password_hash).not.toBe(registerDto.password);
      expect(await bcrypt.compare(registerDto.password, savedUser.password_hash)).toBe(true);
      expect(savedUser.role).toBe(UserRole.CUSTOMER);
      expect(result).toEqual({
        user_id: 'uuid-1',
        email: registerDto.email,
        role: UserRole.CUSTOMER,
        full_name: registerDto.full_name,
      });
      expect(result).not.toHaveProperty('password_hash');
    });

    it('báo lỗi 409 khi email đã tồn tại', async () => {
      userRepository.findOneBy.mockResolvedValue({ user_id: 'uuid-2', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    let existingUser: Partial<User>;

    beforeEach(async () => {
      existingUser = {
        user_id: 'uuid-1',
        email: registerDto.email,
        password_hash: await bcrypt.hash(registerDto.password, 4),
        role: UserRole.CUSTOMER,
        is_active: true,
        profile: { full_name: registerDto.full_name } as User['profile'],
      };
      userRepository.findOne.mockResolvedValue(existingUser);
    });

    it('báo lỗi 401 khi sai mật khẩu', async () => {
      await expect(
        service.login({ email: registerDto.email, password: 'sai-mat-khau' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('báo lỗi 403 khi tài khoản đã bị khóa dù mật khẩu đúng', async () => {
      userRepository.findOne.mockResolvedValue({ ...existingUser, is_active: false });

      await expect(
        service.login({ email: registerDto.email, password: registerDto.password }),
      ).rejects.toThrow(ForbiddenException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('đăng nhập đúng thì trả token và thông tin user', async () => {
      const result = await service.login({
        email: registerDto.email,
        password: registerDto.password,
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: registerDto.email,
        role: UserRole.CUSTOMER,
      });
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user).toEqual({
        user_id: 'uuid-1',
        email: registerDto.email,
        role: UserRole.CUSTOMER,
        full_name: registerDto.full_name,
      });
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });
});
