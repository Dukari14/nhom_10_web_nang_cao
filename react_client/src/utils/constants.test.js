import {
    ORDER_STATUS_LABELS,
    ORDER_STATUS_STEPS,
    ORDER_STATUS_VARIANTS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_VARIANTS,
} from './constants';

describe('nhãn trạng thái', () => {
    test('đủ nhãn tiếng Việt cho mọi trạng thái đơn hàng của backend', () => {
        expect(ORDER_STATUS_LABELS).toEqual({
            pending: 'Chờ xác nhận',
            confirmed: 'Đang xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
        });
        Object.keys(ORDER_STATUS_LABELS).forEach((status) => {
            expect(ORDER_STATUS_VARIANTS[status]).toBeDefined();
        });
    });

    test('các bước của đơn bình thường đều có nhãn và không gồm đơn hủy', () => {
        expect(ORDER_STATUS_STEPS).toEqual(['pending', 'confirmed', 'shipping', 'delivered']);
        ORDER_STATUS_STEPS.forEach((status) => expect(ORDER_STATUS_LABELS[status]).toBeDefined());
    });

    test('nhãn thanh toán', () => {
        expect(PAYMENT_STATUS_LABELS).toEqual({
            pending: 'Chưa thanh toán',
            completed: 'Đã thanh toán',
            failed: 'Thất bại',
        });
        Object.keys(PAYMENT_STATUS_LABELS).forEach((status) => {
            expect(PAYMENT_STATUS_VARIANTS[status]).toBeDefined();
        });
        expect(Object.keys(PAYMENT_METHOD_LABELS)).toEqual(['COD', 'BANK_TRANSFER']);
    });
});
