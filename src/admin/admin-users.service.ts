import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import {
  AdminUserListResponseDto,
  AdminUserResponseDto,
  AdminUsersQueryDto,
  UpdateUserDto,
} from './dto/admin-users.dto';

const DEFAULT_PAGE_SIZE = 10;

// Thoát ký tự đặc biệt của LIKE
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. Danh sách tài khoản, tìm theo email hoặc họ tên
  async findAll(query: AdminUsersQueryDto): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'p');

    if (query.search) {
      qb.andWhere('(u.email LIKE :keyword OR p.full_name LIKE :keyword)', {
        keyword: `%${escapeLike(query.search)}%`,
      });
    }
    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }
    if (query.is_active !== undefined) {
      qb.andWhere('u.is_active = :active', { active: query.is_active });
    }

    const [users, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .addOrderBy('u.user_id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: users.map((user) => this.toResponse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 2. Khóa hoặc mở khóa tài khoản, đổi vai trò
  async update(adminId: string, userId: string, dto: UpdateUserDto): Promise<AdminUserResponseDto> {
    if (dto.is_active === undefined && dto.role === undefined) {
      throw new BadRequestException('Cần gửi ít nhất một trường: is_active hoặc role');
    }
    // Tránh admin tự khóa hoặc tự hạ quyền rồi không còn ai quản trị được
    if (userId === adminId && (dto.is_active === false || (dto.role && dto.role !== UserRole.ADMIN))) {
      throw new BadRequestException('Bạn không thể tự khóa hoặc tự hạ quyền tài khoản của chính mình');
    }

    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: { profile: true },
    });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản có ID = ${userId}`);
    }

    if (dto.is_active !== undefined) user.is_active = dto.is_active;
    if (dto.role !== undefined) user.role = dto.role;
    await this.userRepository.save(user);
    return this.toResponse(user);
  }

  // Chọn từng trường cần trả, không bao giờ đưa password_hash ra ngoài
  private toResponse(user: User): AdminUserResponseDto {
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      full_name: user.profile?.full_name ?? null,
      phone: user.profile?.phone ?? null,
      created_at: user.created_at,
    };
  }
}
