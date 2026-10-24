// API trả giá dạng chuỗi ("5690000.00") hoặc null nên luôn đổi sang số trước khi dùng
export function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

// 5690000 -> "5.690.000đ"
export function formatPrice(value) {
    const number = toNumber(value);
    if (number === null) return '';
    return new Intl.NumberFormat('vi-VN').format(Math.round(number)) + 'đ';
}

// Giá bán thực tế là sale_price nếu có, không thì price.
// Giá gốc chỉ gạch ngang khi cao hơn giá bán.
export function getPriceInfo(product) {
    const price = toNumber(product.price);
    const sale = toNumber(product.sale_price);
    const current = sale !== null ? sale : price;
    const hasDiscount = sale !== null && price !== null && price > sale;
    return {
        current,
        original: hasDiscount ? price : null,
        hasDiscount,
        discountPercent: hasDiscount ? Math.round((1 - sale / price) * 100) : 0,
    };
}

// Tên sản phẩm không chứa tên hãng nên ghép "hãng + tên" ("Vivo X100 Pro 512GB")
export function getDisplayName(product) {
    const name = product.name || '';
    const brand = product.brand || '';
    if (!brand || name.toLowerCase().startsWith(brand.toLowerCase())) return name;
    return `${brand} ${name}`;
}

export function getInitial(product) {
    return getDisplayName(product).trim().charAt(0).toUpperCase() || '?';
}

// "8GB / 256GB · Đen" từ các trường có dữ liệu
export function getSpecLine(product) {
    const memory = [product.ram, product.storage].filter(Boolean).join(' / ');
    return [memory, product.color].filter(Boolean).join(' · ');
}

// Sản phẩm tạo trong vòng 14 ngày được coi là mới
export function isNewProduct(product, days = 14) {
    const created = new Date(product.created_at).getTime();
    if (Number.isNaN(created)) return false;
    return (Date.now() - created) / (1000 * 60 * 60 * 24) <= days;
}

// Danh mục "Điện thoại Samsung" -> thương hiệu "Samsung"
export function brandFromCategory(category) {
    return category.name.replace(/^Điện thoại\s+/i, '').trim();
}
