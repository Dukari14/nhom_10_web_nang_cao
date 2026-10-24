import { EMPTY_PRODUCT_FORM, formToPayload, productToForm, validateProductForm } from './productForm';

const valid = { ...EMPTY_PRODUCT_FORM, category_id: '1', name: 'Galaxy S24', price: '22990000', stock: '5' };

describe('validateProductForm', () => {
    test('dữ liệu hợp lệ không có lỗi', () => {
        expect(validateProductForm(valid)).toEqual({});
        expect(validateProductForm({ ...valid, sale_price: '19990000', stock: '0' })).toEqual({});
    });

    test('giá phải lớn hơn 0', () => {
        expect(validateProductForm({ ...valid, price: '0' }).price).toBeDefined();
        expect(validateProductForm({ ...valid, price: '-5' }).price).toBeDefined();
        expect(validateProductForm({ ...valid, price: '' }).price).toBeDefined();
        expect(validateProductForm({ ...valid, price: 'abc' }).price).toBeDefined();
        expect(validateProductForm({ ...valid, price: '100000000' }).price).toMatch(/99\.999\.999/);
    });

    test('tồn kho là số nguyên không âm', () => {
        expect(validateProductForm({ ...valid, stock: '-1' }).stock).toBeDefined();
        expect(validateProductForm({ ...valid, stock: '1.5' }).stock).toBeDefined();
        expect(validateProductForm({ ...valid, stock: '' }).stock).toBeDefined();
    });

    test('giá khuyến mãi lớn hơn 0 và không vượt giá gốc', () => {
        expect(validateProductForm({ ...valid, sale_price: '0' }).sale_price).toBeDefined();
        expect(validateProductForm({ ...valid, sale_price: '30000000' }).sale_price).toMatch(/không được lớn hơn/);
    });

    test('bắt buộc có danh mục và tên', () => {
        const errors = validateProductForm({ ...valid, category_id: '', name: '   ' });
        expect(errors.category_id).toBeDefined();
        expect(errors.name).toBeDefined();
    });

    test('slug sai định dạng bị từ chối', () => {
        expect(validateProductForm({ ...valid, slug: 'Sai Slug' }).slug).toBeDefined();
        expect(validateProductForm({ ...valid, slug: 'galaxy-s24' }).slug).toBeUndefined();
    });
});

describe('formToPayload', () => {
    test('thêm mới: bỏ qua ô trống, đổi số', () => {
        const payload = formToPayload({ ...valid, brand: ' Samsung ', color: '' }, { isEdit: false });
        expect(payload).toEqual({
            category_id: 1,
            name: 'Galaxy S24',
            price: 22990000,
            stock: 5,
            is_active: true,
            brand: 'Samsung',
        });
    });

    test('sửa: gửi chuỗi rỗng để xóa dữ liệu, sale_price rỗng thành null, không gửi slug', () => {
        const payload = formToPayload({ ...valid, slug: 'galaxy-s24', brand: '' }, { isEdit: true });
        expect(payload.brand).toBe('');
        expect(payload.sale_price).toBeNull();
        expect(payload).not.toHaveProperty('slug');
    });

    test('thêm mới có slug tự nhập thì gửi kèm', () => {
        expect(formToPayload({ ...valid, slug: 'galaxy-s24' }, { isEdit: false }).slug).toBe('galaxy-s24');
    });
});

describe('productToForm', () => {
    test('đổi giá dạng chuỗi DECIMAL và giá trị null thành giá trị ô nhập', () => {
        const form = productToForm({
            category: { category_id: 2 },
            name: 'Galaxy S24',
            slug: 'galaxy-s24',
            brand: null,
            price: '22990000.00',
            sale_price: null,
            stock: 5,
            is_active: false,
        });
        expect(form).toMatchObject({ category_id: '2', brand: '', price: '22990000', sale_price: '', stock: '5', is_active: false });
    });
});
