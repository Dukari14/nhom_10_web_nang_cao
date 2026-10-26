import {
  MAX_AMOUNT_CENTS,
  centsToDecimal,
  fromCents,
  isWithinMoneyLimit,
  toCents,
  unitPriceCents,
} from '../src/common/money';

describe('money - tính tiền theo xu', () => {
  it('đổi chuỗi DECIMAL lớn qua lại không mất chính xác', () => {
    expect(toCents('999999999999.99')).toBe(99_999_999_999_999);
    expect(toCents('174950000.00')).toBe(17_495_000_000);
    expect(centsToDecimal(99_999_999_999_999)).toBe('999999999999.99');
    expect(fromCents(toCents('123456789012.34'))).toBe(123456789012.34);
  });

  it('giới hạn tối đa của DECIMAL(14,2) nằm trong khoảng số nguyên an toàn của JavaScript', () => {
    expect(MAX_AMOUNT_CENTS).toBeLessThan(Number.MAX_SAFE_INTEGER);
    // 100 dòng x 100 máy x 99.999.999,99đ vẫn là số nguyên chính xác
    const worstCase = 100 * 100 * toCents('99999999.99');
    expect(Number.isSafeInteger(worstCase)).toBe(true);
  });

  it('kiểm tra giới hạn của cột tiền', () => {
    expect(isWithinMoneyLimit(0)).toBe(true);
    expect(isWithinMoneyLimit(MAX_AMOUNT_CENTS)).toBe(true);
    expect(isWithinMoneyLimit(MAX_AMOUNT_CENTS + 1)).toBe(false);
    expect(isWithinMoneyLimit(-1)).toBe(false);
    expect(isWithinMoneyLimit(Number.NaN)).toBe(false);
    expect(isWithinMoneyLimit(Number.MAX_SAFE_INTEGER + 2)).toBe(false);
  });

  it('đơn giá lấy giá khuyến mãi nếu có', () => {
    expect(unitPriceCents({ price: '34990000.00', sale_price: '31990000.00' })).toBe(3_199_000_000);
    expect(unitPriceCents({ price: '34990000.00', sale_price: null })).toBe(3_499_000_000);
  });
});
