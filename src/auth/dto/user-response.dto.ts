import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/user.entity';

// Dữ liệu user trả về cho client, cố ý không có password_hash
export class UserResponseDto {
  @ApiProperty({ example: '3f2b8c1e-5a4d-4c0e-9b7a-1d2e3f4a5b6c' })
  user_id: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ example: 'Nguyễn Văn A', nullable: true })
  full_name: string | null;
}
