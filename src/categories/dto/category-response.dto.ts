import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  category_id: number;

  @ApiProperty({ example: 'Điện thoại Samsung' })
  name: string;

  @ApiProperty({ example: 'dien-thoai-samsung' })
  slug: string;

  @ApiProperty({ example: 'Các dòng điện thoại Samsung Galaxy', nullable: true })
  description: string | null;
}
