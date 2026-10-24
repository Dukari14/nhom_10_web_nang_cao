// Giới hạn của cột DECIMAL(10,2) trong database
export const MAX_PRODUCT_PRICE = 99999999.99;

export const EMPTY_PRODUCT_FORM = {
    category_id: '',
    name: '',
    slug: '',
    brand: '',
    color: '',
    ram: '',
    storage: '',
    price: '',
    sale_price: '',
    stock: '0',
    image_url: '',
    description: '',
    config_description: '',
    is_active: true,
};

// Sản phẩm từ API -> giá trị các ô nhập (chuỗi)
export function productToForm(product) {
    const text = (value) => (value === null || value === undefined ? '' : String(value));
    return {
        category_id: product.category ? String(product.category.category_id) : '',
        name: text(product.name),
        slug: text(product.slug),
        brand: text(product.brand),
        color: text(product.color),
        ram: text(product.ram),
        storage: text(product.storage),
        price: product.price === null || product.price === undefined ? '' : String(Number(product.price)),
        sale_price: product.sale_price === null || product.sale_price === undefined ? '' : String(Number(product.sale_price)),
        stock: text(product.stock),
        image_url: text(product.image_url),
        description: text(product.description),
        config_description: text(product.config_description),
        is_active: Boolean(product.is_active),
    };
}

// Kiểm tra form thêm/sửa sản phẩm: giá > 0, giá khuyến mãi > 0 và không vượt giá gốc, tồn kho là số nguyên >= 0
export function validateProductForm(values) {
    const errors = {};
    if (!values.category_id) errors.category_id = 'Vui lòng chọn danh mục';
    if (!values.name.trim()) errors.name = 'Tên sản phẩm không được để trống';

    const price = Number(values.price);
    if (values.price === '' || Number.isNaN(price) || price <= 0) errors.price = 'Giá phải lớn hơn 0';
    else if (price > MAX_PRODUCT_PRICE) errors.price = 'Giá không được vượt quá 99.999.999đ';

    if (values.sale_price !== '') {
        const sale = Number(values.sale_price);
        if (Number.isNaN(sale) || sale <= 0) errors.sale_price = 'Giá khuyến mãi phải lớn hơn 0';
        else if (!errors.price && sale > price) errors.sale_price = 'Giá khuyến mãi không được lớn hơn giá gốc';
    }

    const stock = Number(values.stock);
    if (values.stock === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'Tồn kho phải là số nguyên từ 0 trở lên';

    if (values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
        errors.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang';
    }
    return errors;
}

// Giá trị form -> body gửi lên API. Thêm mới thì bỏ qua ô trống; sửa thì gửi cả chuỗi rỗng để xóa dữ liệu cũ.
export function formToPayload(values, { isEdit }) {
    const payload = {
        category_id: Number(values.category_id),
        name: values.name.trim(),
        price: Number(values.price),
        stock: Number(values.stock),
        is_active: values.is_active,
    };
    const optional = ['brand', 'color', 'ram', 'storage', 'image_url', 'description', 'config_description'];
    optional.forEach((key) => {
        const value = values[key].trim();
        if (value || isEdit) payload[key] = value;
    });
    if (values.sale_price !== '') payload.sale_price = Number(values.sale_price);
    else if (isEdit) payload.sale_price = null; // xóa giá khuyến mãi
    // Slug chỉ gửi khi thêm mới; để trống thì server tự sinh từ tên
    if (!isEdit && values.slug.trim()) payload.slug = values.slug.trim();
    return payload;
}
