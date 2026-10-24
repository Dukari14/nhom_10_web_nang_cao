import { isValidPhone, normalizePhone, validateCheckout } from './validation';

describe('số điện thoại Việt Nam', () => {
    test('chấp nhận số bắt đầu bằng 0 hoặc +84', () => {
        expect(isValidPhone('0987654321')).toBe(true);
        expect(isValidPhone('+84987654321')).toBe(true);
    });

    test('bỏ khoảng trắng, dấu chấm, gạch ngang trước khi kiểm tra', () => {
        expect(normalizePhone('0987 654.321-0')).toBe('09876543210');
        expect(isValidPhone('0987 654 321')).toBe(true);
        expect(isValidPhone('0987.654.321')).toBe(true);
    });

    test('từ chối số sai độ dài hoặc có chữ', () => {
        expect(isValidPhone('123')).toBe(false);
        expect(isValidPhone('098765432')).toBe(false);
        expect(isValidPhone('09876543210')).toBe(false);
        expect(isValidPhone('09876abcde')).toBe(false);
        expect(isValidPhone('')).toBe(false);
        expect(isValidPhone(undefined)).toBe(false);
    });
});

describe('validateCheckout', () => {
    test('dữ liệu hợp lệ thì không có lỗi', () => {
        expect(validateCheckout({ shipping_address: '12 Nguyễn Trãi, Hà Nội', phone: '0987654321' })).toEqual({});
    });

    test('báo lỗi từng trường', () => {
        const errors = validateCheckout({ shipping_address: '  ab ', phone: '12' });
        expect(errors.shipping_address).toMatch(/địa chỉ/i);
        expect(errors.phone).toMatch(/số điện thoại/i);
    });

    test('địa chỉ quá dài bị từ chối', () => {
        expect(validateCheckout({ shipping_address: 'a'.repeat(256), phone: '0987654321' }).shipping_address).toBeDefined();
    });
});
