import {
    ORDER_STATUS_LABELS,
    ORDER_STATUS_STEPS,
    ORDER_STATUS_TONES,
    ORDER_TRANSITIONS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_TONES,
    ROLE_LABELS,
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
            expect(ORDER_STATUS_TONES[status]).toBeDefined();
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
            expect(PAYMENT_STATUS_TONES[status]).toBeDefined();
        });
        expect(Object.keys(PAYMENT_METHOD_LABELS)).toEqual(['COD', 'BANK_TRANSFER']);
    });
});

describe('chuyển trạng thái đơn hàng', () => {
    test('chỉ đi tiến, hủy được khi chưa giao', () => {
        expect(ORDER_TRANSITIONS.pending).toEqual(['confirmed', 'cancelled']);
        expect(ORDER_TRANSITIONS.confirmed).toEqual(['shipping', 'cancelled']);
        expect(ORDER_TRANSITIONS.shipping).toEqual(['delivered']);
        expect(ORDER_TRANSITIONS.delivered).toEqual([]);
        expect(ORDER_TRANSITIONS.cancelled).toEqual([]);
    });

    test('mọi trạng thái đích đều có nhãn tiếng Việt', () => {
        Object.values(ORDER_TRANSITIONS)
            .flat()
            .forEach((status) => expect(ORDER_STATUS_LABELS[status]).toBeDefined());
    });

    test('tông màu huy hiệu đúng ý nghĩa', () => {
        expect(ORDER_STATUS_TONES).toEqual({
            pending: 'gray',
            confirmed: 'blue',
            shipping: 'yellow',
            delivered: 'green',
            cancelled: 'red',
        });
    });

    test('nhãn vai trò', () => {
        expect(ROLE_LABELS).toEqual({ admin: 'Quản trị viên', customer: 'Khách hàng' });
    });
});
