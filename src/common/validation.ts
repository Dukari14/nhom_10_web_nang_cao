import { BadRequestException, ValidationError } from '@nestjs/common';

// Thông báo mặc định của class-validator là tiếng Anh. Mẫu dưới đây dịch theo loại ràng buộc.
// Thông báo tự viết trong DTO (đã là tiếng Việt, có dấu) được giữ nguyên.
const TEMPLATES: Record<string, (field: string, num?: string) => string> = {
  whitelistValidation: (f) => `Trường "${f}" không được phép gửi lên`,
  isInt: (f) => `${f} phải là số nguyên`,
  isNumber: (f) => `${f} phải là số`,
  isString: (f) => `${f} phải là chuỗi ký tự`,
  isBoolean: (f) => `${f} phải là true hoặc false`,
  isNotEmpty: (f) => `${f} không được để trống`,
  isEmail: (f) => `${f} không phải email hợp lệ`,
  isEnum: (f) => `${f} không nằm trong các giá trị cho phép`,
  isUuid: (f) => `${f} phải đúng định dạng UUID`,
  isPositive: (f) => `${f} phải lớn hơn 0`,
  min: (f, n) => `${f} không được nhỏ hơn ${n}`,
  max: (f, n) => `${f} không được lớn hơn ${n}`,
  minLength: (f, n) => `${f} phải có ít nhất ${n} ký tự`,
  maxLength: (f, n) => `${f} không được dài quá ${n} ký tự`,
  matches: (f) => `${f} không đúng định dạng`,
};

const NON_ASCII = /[^\x00-\x7F]/;

function translate(constraint: string, field: string, message: string): string {
  if (NON_ASCII.test(message)) return message;
  const number = message.match(/(-?\d+(?:\.\d+)?)(?!.*\d)/)?.[1];
  return TEMPLATES[constraint]?.(field, number) ?? `${field} không hợp lệ`;
}

function flatten(errors: ValidationError[], parent = ''): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    for (const [constraint, message] of Object.entries(error.constraints ?? {})) {
      messages.push(translate(constraint, field, message));
    }
    if (error.children?.length) {
      messages.push(...flatten(error.children, field));
    }
  }
  return messages;
}

// Dùng cho ValidationPipe({ exceptionFactory }) để mọi lỗi dữ liệu đều bằng tiếng Việt
export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException(flatten(errors));
}
