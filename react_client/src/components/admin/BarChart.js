import { formatPrice } from '../../utils/format';

// Biểu đồ cột vẽ bằng CSS (không dùng thư viện). data: [{ label, value, note }]
// Chiều cao mỗi cột tỉ lệ với giá trị lớn nhất; rê chuột vào cột để xem số liệu.
export default function BarChart({ data, ariaLabel }) {
    const max = Math.max(0, ...data.map((item) => item.value));
    // Chỉ ghi nhãn vài mốc dọc trục ngang để không bị chen chúc
    const step = Math.max(1, Math.ceil(data.length / 8));
    const minWidth = data.length * 7;

    return (
        <div>
            <div className="text-secondary small mb-1">Cao nhất: {formatPrice(max)}</div>
            <div className="bar-chart-scroll">
                <div className="bar-chart" style={{ minWidth }} role="img" aria-label={ariaLabel}>
                    {data.map((item) => (
                        <div
                            key={item.label}
                            className={`bar-chart-bar ${item.value > 0 ? '' : 'is-empty'}`}
                            style={{ height: item.value > 0 && max > 0 ? `${Math.max(2, (item.value / max) * 100)}%` : '2px' }}
                            title={`${item.label}: ${formatPrice(item.value)}${item.note ? ` (${item.note})` : ''}`}
                        />
                    ))}
                </div>
                <div className="d-flex text-secondary small mt-1" style={{ minWidth }} aria-hidden="true">
                    {data.map((item, index) => (
                        <span key={item.label} className="text-nowrap" style={{ flex: '1 1 0' }}>
                            {index % step === 0 ? item.label : ''}
                        </span>
                    ))}
                </div>
            </div>
            {/* Bảng ẩn cho trình đọc màn hình */}
            <table className="visually-hidden">
                <caption>{ariaLabel}</caption>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.label}>
                            <th scope="row">{item.label}</th>
                            <td>{formatPrice(item.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
