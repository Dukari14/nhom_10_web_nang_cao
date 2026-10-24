import { Badge } from 'react-bootstrap';

// Huy hiệu tròn, màu theo ý nghĩa: gray, blue, yellow, green, red, dark (khai báo ở index.css)
export default function StatusBadge({ tone = 'gray', className = '', children }) {
    return (
        <Badge bg="none" className={`tone-${tone} ${className}`.trim()}>
            {children}
        </Badge>
    );
}
