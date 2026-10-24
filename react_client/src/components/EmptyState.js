import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Trạng thái rỗng: một câu nói rõ chuyện gì đang xảy ra và nhiều nhất một nút hành động.
// Truyền "to" để nút là liên kết, hoặc "onAction" để nút chạy một hàm.
export default function EmptyState({ message, actionLabel, to, onAction }) {
    return (
        <div className="empty-state" role="status">
            <p className={actionLabel ? 'mb-3' : 'mb-0'}>{message}</p>
            {actionLabel &&
                (to ? (
                    <Button as={Link} to={to} variant="primary">
                        {actionLabel}
                    </Button>
                ) : (
                    <Button variant="primary" onClick={onAction}>
                        {actionLabel}
                    </Button>
                ))}
        </div>
    );
}
