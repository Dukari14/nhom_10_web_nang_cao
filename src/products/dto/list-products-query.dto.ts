import { Transform } from 'class-transformer';
import { toNumber, toText } from '../../common/transforms';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @Transform(toText)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(toText)
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(toText)
  @IsString()
  @MaxLength(20)
  storage?: string;

  @IsOptional()
  @Transform(toText)
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class LatestProductsQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
