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

// Chuỗi 2 chữ số thập phân để lưu vào cột DECIMAL(14,2)
export function centsToDecimal(cents: number): string {
  return fromCents(cents).toFixed(2);
}

// Cột tiền là DECIMAL(14,2): tối đa 999.999.999.999,99 (gần 1.000 tỷ).
// Tính bằng xu thì tối đa 99.999.999.999.999 (14 chữ số), nhỏ hơn nhiều so với giới hạn
// số nguyên an toàn của JavaScript (9.007.199.254.740.991) nên phép cộng và nhân không bị mất chính xác.
export const MAX_AMOUNT_CENTS = 99_999_999_999_999;

// true nếu số xu là số nguyên không âm, nằm trong giới hạn cột DECIMAL(14,2)
export function isWithinMoneyLimit(cents: number): boolean {
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= MAX_AMOUNT_CENTS;
}
