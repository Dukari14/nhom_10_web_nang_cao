import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Matches } from 'class-validator';
import { toText } from '../../common/transforms';

export enum StatsGroupBy {
  DAY = 'day',
  MONTH = 'month',
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class StatsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'Ngày bắt đầu (YYYY-MM-DD). Mặc định: 29 ngày trước ngày kết thúc' })
  @IsOptional()
  @Transform(toText)
  @Matches(DATE_PATTERN, { message: 'from phải có dạng YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Ngày kết thúc, tính cả ngày này (YYYY-MM-DD). Mặc định: hôm nay' })
  @IsOptional()
  @Transform(toText)
  @Matches(DATE_PATTERN, { message: 'to phải có dạng YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ enum: StatsGroupBy, default: StatsGroupBy.DAY, description: 'Gom doanh thu theo ngày hoặc theo tháng' })
  @IsOptional()
  @Transform(toText)
  @IsEnum(StatsGroupBy, { message: 'groupBy phải là day hoặc month' })
  groupBy?: StatsGroupBy;
}

export class StatsRangeDto {
  @ApiProperty({ example: '2026-10-01' })
  from: string;

  @ApiProperty({ example: '2026-10-31' })
  to: string;

  @ApiProperty({ enum: StatsGroupBy })
  groupBy: StatsGroupBy;
}

export class StatsTotalsDto {
  @ApiProperty({ example: 482500000, description: 'Tổng doanh thu các đơn đã giao' })
  revenue: number;

  @ApiProperty({ example: 25, description: 'Số đơn đã giao' })
  orders: number;

  @ApiProperty({ example: 37, description: 'Số điện thoại đã bán ra' })
  products_sold: number;
}

export class StatsSeriesPointDto {
  @ApiProperty({ example: '2026-10-23', description: 'YYYY-MM-DD khi gom theo ngày, YYYY-MM khi gom theo tháng' })
  period: string;

  @ApiProperty({ example: 39980000 })
  revenue: number;

  @ApiProperty({ example: 2 })
  orders: number;
}

export class TopProductDto {
  @ApiProperty({ example: 1 })
  product_id: number;

  @ApiProperty({ example: 'Galaxy S24 256GB' })
  name: string;

  @ApiProperty({ example: 9 })
  quantity_sold: number;

  @ApiProperty({ example: 179910000 })
  revenue: number;
}

export class StatsResponseDto {
  @ApiProperty({ type: StatsRangeDto })
  range: StatsRangeDto;

  @ApiProperty({ type: StatsTotalsDto })
  totals: StatsTotalsDto;

  @ApiProperty({ type: [StatsSeriesPointDto], description: 'Ngày hoặc tháng không có đơn vẫn xuất hiện với giá trị 0' })
  series: StatsSeriesPointDto[];

  @ApiProperty({ type: [TopProductDto], description: 'Tối đa 5 sản phẩm bán chạy nhất' })
  top_products: TopProductDto[];
}
