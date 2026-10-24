import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { createValidationException } from '../src/common/validation';
import { ParseIdPipe, ParseUuidPipe } from '../src/common/pipes';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { ListProductsQueryDto } from '../src/products/dto/list-products-query.dto';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  // Không để log lỗi 500 làm rối kết quả test
  jest.spyOn((filter as any).logger, 'error').mockImplementation(() => undefined);

  function run(exception: unknown) {
    let status = 0;
    let body: any;
    const response = { status: (s: number) => ({ json: (b: unknown) => { status = s; body = b; } }) };
    const request = { originalUrl: '/api/products?search=bi-mat', url: '/api/products?search=bi-mat' };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
    filter.catch(exception, host as any);
    return { status, body };
  }

  it.each([
    [new NotFoundException('Không tìm thấy sản phẩm'), 404],
    [new ConflictException('Email đã được sử dụng'), 409],
    [new UnauthorizedException('Bạn chưa đăng nhập'), 401],
    [new ForbiddenException('Bạn không có quyền'), 403],
    [new BadRequestException(['Giá phải lớn hơn 0', 'Tồn kho không được âm']), 400],
  ])('giữ nguyên mã và thông báo tiếng Việt (%#)', (exception, status) => {
    const { status: s, body } = run(exception);

    expect(s).toBe(status);
    expect(body.statusCode).toBe(status);
    expect(body.message).toEqual((exception.getResponse() as { message: unknown }).message);
  });

  it('dùng cùng một dạng JSON, đường dẫn không kèm query string', () => {
    const { body } = run(new NotFoundException('Không tìm thấy'));

    expect(Object.keys(body).sort()).toEqual(['error', 'message', 'path', 'statusCode', 'timestamp']);
    expect(body.path).toBe('/api/products');
    expect(body.error).toBe('Không tìm thấy');
  });

  it('đổi thông báo tiếng Anh mặc định của framework sang tiếng Việt', () => {
    expect(run(new NotFoundException('Cannot GET /api/xyz')).body.message).toBe('Đường dẫn không tồn tại');
    expect(run(new ForbiddenException()).body.message).toBe('Bạn không có quyền thực hiện thao tác này');
    expect(run(new UnauthorizedException()).body.message).toBe('Bạn chưa đăng nhập');
    expect(run(new ThrottlerException()).body).toMatchObject({
      statusCode: 429,
      message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
    });
  });

  it('lỗi JSON sai cú pháp từ body-parser trả 400 tiếng Việt', () => {
    const syntaxError = Object.assign(new SyntaxError('Unexpected token } in JSON at position 5'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    const { status, body } = run(syntaxError);

    expect(status).toBe(400);
    expect(body.message).toBe('Dữ liệu JSON gửi lên không hợp lệ');
    expect(JSON.stringify(body)).not.toContain('Unexpected token');
  });

  it('Nest bọc lỗi JSON sai cú pháp thành BadRequestException cũng được dịch', () => {
    const { body } = run(new BadRequestException('Unexpected token } in JSON at position 10'));

    expect(body.message).toBe('Dữ liệu JSON gửi lên không hợp lệ');
  });

  it('lỗi MySQL được đổi thành mã HTTP phù hợp và không lộ câu SQL', () => {
    const dup = Object.assign(new Error("Duplicate entry 'a@test.com' for key 'users.IDX_email'"), {
      driverError: { code: 'ER_DUP_ENTRY' },
      query: 'INSERT INTO users ...',
    });
    const fk = Object.assign(new Error('Cannot delete or update a parent row'), { code: 'ER_ROW_IS_REFERENCED_2' });

    const dupResult = run(dup);
    expect(dupResult.status).toBe(409);
    expect(JSON.stringify(dupResult.body)).not.toMatch(/INSERT|Duplicate entry|a@test.com/);
    expect(run(fk).status).toBe(409);
  });

  it('lỗi không lường trước trả 500 chung chung, không lộ stack trace hay chi tiết hệ thống', () => {
    const secret = new Error("connect ECONNREFUSED 127.0.0.1:3306 at D:\\code\\secret\\file.ts:10");

    const { status, body } = run(secret);

    expect(status).toBe(500);
    expect(body.message).toBe('Lỗi máy chủ, vui lòng thử lại sau');
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/ECONNREFUSED|3306|secret|stack|\.ts/);
  });

  it('không để sót thông báo tiếng Anh lạ', () => {
    const { body } = run(new BadRequestException('Some English framework message'));

    expect(body.message).toBe('Yêu cầu không hợp lệ');
  });
});

describe('Pipes kiểm tra ID', () => {
  it('ID không phải số nguyên trả 400 tiếng Việt', async () => {
    await expect(ParseIdPipe.transform('abc', { type: 'param', data: 'id' })).rejects.toMatchObject({
      response: { message: 'ID không hợp lệ, phải là số nguyên' },
    });
    await expect(ParseIdPipe.transform('12', { type: 'param', data: 'id' })).resolves.toBe(12);
  });

  it('ID không đúng UUID trả 400 tiếng Việt', async () => {
    await expect(ParseUuidPipe.transform('khong-phai-uuid', { type: 'param', data: 'id' })).rejects.toMatchObject({
      response: { message: 'ID không hợp lệ, phải đúng định dạng UUID' },
    });
  });
});

describe('Thông báo lỗi validation tiếng Việt', () => {
  async function errorsOf(cls: new () => object, plain: object): Promise<string[]> {
    const errors = await validate(plainToInstance(cls, plain), { whitelist: true, forbidNonWhitelisted: true });
    return (createValidationException(errors).getResponse() as { message: string[] }).message;
  }

  it('giữ thông báo tự viết trong DTO', async () => {
    const messages = await errorsOf(RegisterDto, { email: 'sai', password: '123', full_name: 'A' });

    expect(messages).toEqual(expect.arrayContaining(['Email không hợp lệ', 'Mật khẩu phải có ít nhất 8 ký tự']));
  });

  it('dịch thông báo mặc định và trường thừa sang tiếng Việt', async () => {
    const messages = await errorsOf(ListProductsQueryDto, { limit: 999, page: 0, foo: 'x', minPrice: 'abc' });

    expect(messages).toEqual(
      expect.arrayContaining([
        'limit không được lớn hơn 50',
        'page không được nhỏ hơn 1',
        'Trường "foo" không được phép gửi lên',
      ]),
    );
    expect(messages.join(' ')).not.toMatch(/must|should|property/);
  });
});
