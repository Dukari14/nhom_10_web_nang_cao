import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger,} from '@nestjs/common';
import type { Request, Response } from 'express';

const ERROR_TITLES: Record<number, string> = {
  400: 'Yêu cầu không hợp lệ',
  401: 'Chưa xác thực',
  403: 'Không có quyền truy cập',
  404: 'Không tìm thấy',
  405: 'Phương thức không được hỗ trợ',
  409: 'Dữ liệu xung đột',
  413: 'Dữ liệu gửi lên quá lớn',
  415: 'Định dạng dữ liệu không được hỗ trợ',
  422: 'Dữ liệu không xử lý được',
  429: 'Quá nhiều yêu cầu',
  500: 'Lỗi máy chủ',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Yêu cầu không hợp lệ',
  401: 'Bạn chưa đăng nhập',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu yêu cầu',
  405: 'Phương thức này không được hỗ trợ',
  409: 'Dữ liệu bị xung đột với dữ liệu đã có',
  413: 'Dữ liệu gửi lên quá lớn',
  415: 'Định dạng dữ liệu gửi lên không được hỗ trợ',
  422: 'Dữ liệu không xử lý được',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
};

// Thông báo tiếng Anh mặc định của framework được đổi sang tiếng Việt
const MESSAGE_PATTERNS: [RegExp, string][] = [
  [/^Cannot (GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD) /, 'Đường dẫn không tồn tại'],
  [/Too Many Requests/i, DEFAULT_MESSAGES[429]],
  [/numeric string is expected/i, 'ID không hợp lệ, phải là số nguyên'],
  [/uuid is expected/i, 'ID không hợp lệ, phải đúng định dạng UUID'],
  [/JSON|Unexpected (token|end)/i, 'Dữ liệu JSON gửi lên không hợp lệ'],
  [/entity too large/i, DEFAULT_MESSAGES[413]],
];

const NON_ASCII = /[^\x00-\x7F]/;

// Lỗi từ MySQL (QueryFailedError) đổi thành mã HTTP phù hợp, không lộ câu SQL
const DB_ERRORS: Record<string, { status: number; message: string }> = {
  ER_DUP_ENTRY: { status: 409, message: 'Dữ liệu bị trùng với bản ghi đã có' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'Dữ liệu đang được sử dụng ở nơi khác nên không thể xóa' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Dữ liệu tham chiếu không tồn tại' },
  ER_DATA_TOO_LONG: { status: 400, message: 'Dữ liệu gửi lên quá dài' },
  ER_WARN_DATA_OUT_OF_RANGE: { status: 400, message: 'Giá trị nằm ngoài phạm vi cho phép' },
  ER_DATA_OUT_OF_RANGE: { status: 400, message: 'Giá trị nằm ngoài phạm vi cho phép' },
  ER_TRUNCATED_WRONG_VALUE: { status: 400, message: 'Dữ liệu gửi lên không hợp lệ' },
};

interface ResolvedError {
  status: number;
  message: string | string[];
}

// Mọi lỗi đều trả về cùng một dạng JSON:
// { statusCode, error, message, path, timestamp }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    response.status(status).json({
      statusCode: status,
      error: ERROR_TITLES[status] ?? 'Lỗi',
      message,
      // Chỉ trả đường dẫn, không kèm query string
      path: request.originalUrl?.split('?')[0] ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : ((body as { message?: string | string[] }).message ?? exception.message);
      const message = Array.isArray(raw)
        ? raw.map((m) => this.translate(status, m))
        : this.translate(status, raw);
      return { status, message };
    }

    const error = exception as {
      status?: number;
      type?: string;
      code?: string;
      driverError?: { code?: string };
    };

    // Lỗi của body-parser: JSON sai cú pháp hoặc quá lớn
    if (typeof error?.type === 'string' && typeof error.status === 'number' && error.status < 500) {
      const message =
        error.type === 'entity.parse.failed'
          ? 'Dữ liệu JSON gửi lên không hợp lệ'
          : error.type === 'entity.too.large'
            ? DEFAULT_MESSAGES[413]
            : DEFAULT_MESSAGES[error.status] ?? DEFAULT_MESSAGES[400];
      return { status: error.status, message };
    }

    // Lỗi từ MySQL mà service chưa tự xử lý
    const dbCode = error?.driverError?.code ?? error?.code;
    if (dbCode && DB_ERRORS[dbCode]) {
      return DB_ERRORS[dbCode];
    }

    // Lỗi không lường trước: chỉ ghi log phía server, không lộ chi tiết cho client
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: DEFAULT_MESSAGES[500] };
  }

  private translate(status: number, message: string): string {
    if (NON_ASCII.test(message)) return message;
    for (const [pattern, vietnamese] of MESSAGE_PATTERNS) {
      if (pattern.test(message)) return vietnamese;
    }
    // Thông báo tiếng Anh còn sót lại thì dùng câu mặc định theo mã lỗi
    return DEFAULT_MESSAGES[status] ?? DEFAULT_MESSAGES[400];
  }
}
