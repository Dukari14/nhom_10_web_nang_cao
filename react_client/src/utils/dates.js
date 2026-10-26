const pad = (number) => String(number).padStart(2, '0');

// Date -> "2026-10-24" (giá trị cho ô <input type="date">, theo giờ máy người dùng)
export function toDateInputValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Khoảng "days ngày gần nhất" tính cả hôm nay, mặc định 30 ngày
export function getDefaultRange(days = 30, today = new Date()) {
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    return { from: toDateInputValue(from), to: toDateInputValue(today) };
}

// Số ngày từ from đến to, tính cả hai đầu; trả NaN nếu chuỗi không phải ngày
export function countDays(from, to) {
    const parse = (value) => {
        const [y, m, d] = String(value).split('-').map(Number);
        return Date.UTC(y, m - 1, d);
    };
    return (parse(to) - parse(from)) / (24 * 60 * 60 * 1000) + 1;
}

// "2026-10-24" -> "24/10", "2026-10" -> "10/2026"
export function formatPeriodLabel(period) {
    const parts = String(period).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
    return String(period);
}
