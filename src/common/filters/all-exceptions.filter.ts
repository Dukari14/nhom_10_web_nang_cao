import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'http';
import type { Request, Response } from 'express';

// Mọi lỗi đều trả về cùng một dạng JSON:
// { statusCode, error, message, path, timestamp }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Lỗi máy chủ, vui lòng thử lại sau';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      // message có thể là mảng khi ValidationPipe báo nhiều lỗi
      message = typeof body === 'string' ? body : ((body as { message?: string | string[] }).message ?? exception.message);
    } else {
      // Lỗi không lường trước: chỉ ghi log, không lộ chi tiết cho client
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(statusCode).json({
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
