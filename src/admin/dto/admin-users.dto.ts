import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { UserRole } from '../../user/user.entity';
import { toBoolean, toNumber, toText } from '../../common/transforms';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ example: 'nguyen', description: 'Tìm theo email hoặc họ tên' })
  @IsOptional()
  @Transform(toText)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @Transform(toText)
  @IsEnum(UserRole, { message: 'Vai trò phải là admin hoặc customer' })
  role?: UserRole;

  @ApiPropertyOptional({ example: false, description: 'false: chỉ lấy tài khoản đang bị khóa' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'is_active phải là true hoặc false' })
  is_active?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 50 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: false, description: 'false = khóa tài khoản, true = mở khóa' })
  @IsOptional()
  @IsBoolean({ message: 'is_active phải là true hoặc false' })
  is_active?: boolean;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò phải là admin hoặc customer' })
  role?: UserRole;
}

// Không có password_hash
export class AdminUserResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 'Nguyễn Văn A', nullable: true })
  full_name: string | null;

  @ApiProperty({ example: '0987654321', nullable: true })
  phone: string | null;

  @ApiProperty()
  created_at: Date;
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  items: AdminUserResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
