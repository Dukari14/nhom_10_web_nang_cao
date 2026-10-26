import { countDays, formatPeriodLabel, getDefaultRange, toDateInputValue } from './dates';

describe('ngày tháng cho thống kê', () => {
    test('định dạng giá trị cho ô chọn ngày', () => {
        expect(toDateInputValue(new Date(2026, 9, 4))).toBe('2026-10-04');
    });

    test('khoảng 30 ngày gần nhất tính cả hôm nay', () => {
        expect(getDefaultRange(30, new Date(2026, 9, 24))).toEqual({ from: '2026-09-25', to: '2026-10-24' });
        expect(getDefaultRange(30, new Date(2026, 0, 10))).toEqual({ from: '2025-12-12', to: '2026-01-10' });
    });

    test('đếm số ngày gồm cả hai đầu', () => {
        expect(countDays('2026-10-01', '2026-10-01')).toBe(1);
        expect(countDays('2026-10-01', '2026-10-31')).toBe(31);
        expect(countDays('2025-01-01', '2025-12-31')).toBe(365);
        expect(countDays('2026-10-10', '2026-10-01')).toBeLessThan(1);
    });

    test('nhãn trục ngang theo ngày hoặc tháng', () => {
        expect(formatPeriodLabel('2026-10-24')).toBe('24/10');
        expect(formatPeriodLabel('2026-10')).toBe('10/2026');
    });
});
