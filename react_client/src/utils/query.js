// Tạo query string, bỏ qua giá trị rỗng: { search: 'iphone', brand: '' } -> "search=iphone"
export function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
        }
    });
    return query.toString();
}
