import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload, SALT_ROUNDS } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Đăng ký tài khoản khách hàng mới
  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existed = await this.userRepository.findOneBy({ email: dto.email });
    if (existed) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    // Luôn gán role customer, không cho client tự chọn role
    const newUser = this.userRepository.create({
      email: dto.email,
      password_hash,
      role: UserRole.CUSTOMER,
      profile: { full_name: dto.full_name },
    });

    try {
      return this.toResponse(await this.userRepository.save(newUser));
    } catch (error) {
      // Hai request đăng ký cùng email chạy đồng thời: DB báo trùng khóa UNIQUE
      if (this.isDuplicateError(error)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  // 2. Đăng nhập, trả về token và thông tin user
  async login(dto: LoginDto): Promise<{ token: string; user: UserResponseDto }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: { profile: true },
    });
    const isMatch = user ? await bcrypt.compare(dto.password, user.password_hash) : false;
    // Cùng một thông báo cho cả "sai email" và "sai mật khẩu" để không lộ email nào tồn tại
    if (!user || !isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload: JwtPayload = { sub: user.user_id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return { token, user: this.toResponse(user) };
  }

  // 3. Lấy thông tin người đang đăng nhập
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    return this.toResponse(user);
  }

  // Chỉ chọn các trường an toàn, không bao giờ đưa password_hash ra ngoài
  private toResponse(user: User): UserResponseDto {
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.profile?.full_name ?? null,
    };
  }

  private isDuplicateError(error: unknown): boolean {
    const e = error as { code?: string; driverError?: { code?: string } };
    return (e?.driverError?.code ?? e?.code) === 'ER_DUP_ENTRY';
  }
}
