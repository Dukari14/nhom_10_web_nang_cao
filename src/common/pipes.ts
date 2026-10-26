import { BadRequestException, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

// Dùng thay cho ParseIntPipe / ParseUUIDPipe mặc định để thông báo lỗi bằng tiếng Việt
export const ParseIdPipe = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('ID không hợp lệ, phải là số nguyên'),
});

export const ParseUuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('ID không hợp lệ, phải đúng định dạng UUID'),
});
