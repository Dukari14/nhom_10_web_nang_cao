// Số điện thoại Việt Nam: bắt đầu bằng 0 hoặc +84, theo sau 9 chữ số (cùng quy tắc với backend)
const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

// Người dùng hay gõ "0987 654 321" hoặc "0987.654.321" nên bỏ khoảng trắng, dấu chấm, gạch ngang trước khi kiểm tra
export function normalizePhone(value) {
    return String(value || '').replace(/[\s.-]/g, '');
}

export function isValidPhone(value) {
    return PHONE_PATTERN.test(normalizePhone(value));
}

export function validateCheckout({ shipping_address, phone }) {
    const errors = {};
    const address = String(shipping_address || '').trim();
    if (address.length < 5) errors.shipping_address = 'Vui lòng nhập địa chỉ nhận hàng (ít nhất 5 ký tự)';
    else if (address.length > 255) errors.shipping_address = 'Địa chỉ không được dài quá 255 ký tự';
    if (!isValidPhone(phone)) errors.phone = 'Số điện thoại không hợp lệ (ví dụ 0987654321)';
    return errors;
}
