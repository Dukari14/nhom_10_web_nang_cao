// Cột DECIMAL trả về dạng chuỗi ("5690000.00"). Mọi phép cộng tiền đều quy đổi
// ra "xu" (số nguyên = tiền x 100) để tránh sai số dấu phẩy động của số thực.

export function toCents(value: string | number): number {
  return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

// Giá khách phải trả cho 1 sản phẩm: giá khuyến mãi nếu có, không thì giá gốc
export function unitPriceCents(product: { price: string | number; sale_price: string | number | null }): number {
  return toCents(product.sale_price ?? product.price);
}

// Chuỗi 2 chữ số thập phân để lưu vào cột DECIMAL(10,2)
export function centsToDecimal(cents: number): string {
  return fromCents(cents).toFixed(2);
}
