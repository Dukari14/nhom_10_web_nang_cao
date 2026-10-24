import {
    brandFromCategory,
    formatDate,
    formatDateTime,
    getOrderItemName,
    getOrderItemsSummary,
    formatPrice,
    getDisplayName,
    getInitial,
    getPriceInfo,
    getSpecLine,
    toNumber,
} from './format';

describe('toNumber / formatPrice', () => {
    test('đổi chuỗi DECIMAL sang số', () => {
        expect(toNumber('5690000.00')).toBe(5690000);
        expect(toNumber(null)).toBeNull();
        expect(toNumber('')).toBeNull();
        expect(toNumber('abc')).toBeNull();
    });

    test('định dạng tiền Việt', () => {
        expect(formatPrice('5690000.00')).toBe('5.690.000đ');
        expect(formatPrice(19990000)).toBe('19.990.000đ');
        expect(formatPrice(null)).toBe('');
    });
});

describe('getPriceInfo', () => {
    test('có giá khuyến mãi: giá bán là sale_price, giá gốc gạch ngang', () => {
        const info = getPriceInfo({ price: '22990000.00', sale_price: '19990000.00' });
        expect(info).toMatchObject({ current: 19990000, original: 22990000, hasDiscount: true, discountPercent: 13 });
    });

    test('không có sale_price: giá bán là price', () => {
        const info = getPriceInfo({ price: '3290000.00', sale_price: null });
        expect(info).toMatchObject({ current: 3290000, original: null, hasDiscount: false });
    });

    test('sale_price bằng price thì không gạch giá', () => {
        expect(getPriceInfo({ price: '100.00', sale_price: '100.00' }).hasDiscount).toBe(false);
    });
});

describe('tên và thông số sản phẩm', () => {
    test('ghép hãng với tên', () => {
        expect(getDisplayName({ brand: 'Vivo', name: 'X100 Pro 512GB' })).toBe('Vivo X100 Pro 512GB');
    });

    test('không ghép lặp khi tên đã có hãng', () => {
        expect(getDisplayName({ brand: 'Xiaomi', name: 'Xiaomi 14 256GB' })).toBe('Xiaomi 14 256GB');
    });

    test('chữ cái đầu cho khung ảnh', () => {
        expect(getInitial({ brand: 'Vivo', name: 'X100' })).toBe('V');
        expect(getInitial({ name: '' })).toBe('?');
    });

    test('dòng thông số bỏ qua phần thiếu', () => {
        expect(getSpecLine({ ram: '8GB', storage: '256GB', color: 'Đen' })).toBe('8GB / 256GB · Đen');
        expect(getSpecLine({ ram: null, storage: '128GB', color: null })).toBe('128GB');
    });

    test('lấy thương hiệu từ tên danh mục', () => {
        expect(brandFromCategory({ name: 'Điện thoại Samsung' })).toBe('Samsung');
    });
});

describe('ngày giờ', () => {
    test('định dạng ngày và giờ theo kiểu Việt Nam', () => {
        const date = new Date(2026, 9, 4, 13, 5);
        expect(formatDate(date)).toBe('04/10/2026');
        expect(formatDateTime(date)).toBe('04/10/2026 13:05');
    });

    test('giá trị sai trả chuỗi rỗng', () => {
        expect(formatDate('khong-phai-ngay')).toBe('');
        expect(formatDateTime(null)).toBe('');
    });
});

describe('dòng hàng trong đơn', () => {
    const order = {
        items: [
            { product_brand: 'Samsung', product_name: 'Galaxy S24 256GB' },
            { product_brand: 'Xiaomi', product_name: 'Xiaomi 14 256GB' },
            { product_brand: null, product_name: 'Máy khác' },
        ],
    };

    test('tên dòng hàng ghép hãng, không lặp hãng', () => {
        expect(getOrderItemName(order.items[0])).toBe('Samsung Galaxy S24 256GB');
        expect(getOrderItemName(order.items[1])).toBe('Xiaomi 14 256GB');
        expect(getOrderItemName(order.items[2])).toBe('Máy khác');
    });

    test('tóm tắt đơn hàng', () => {
        expect(getOrderItemsSummary({ items: [order.items[0]] })).toBe('Samsung Galaxy S24 256GB');
        expect(getOrderItemsSummary(order)).toBe('Samsung Galaxy S24 256GB và 2 sản phẩm khác');
        expect(getOrderItemsSummary({ items: [] })).toBe('');
    });
});
