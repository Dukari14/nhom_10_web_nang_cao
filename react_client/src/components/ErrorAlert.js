import { Alert } from 'react-bootstrap';

// Hiển thị một hoặc nhiều thông báo lỗi bằng tiếng Việt, không dùng popup chặn màn hình
export default function ErrorAlert({ messages, onClose, className }) {
    const list = Array.isArray(messages) ? messages : messages ? [messages] : [];
    if (list.length === 0) return null;

    return (
        <Alert variant="danger" dismissible={Boolean(onClose)} onClose={onClose} className={className} role="alert">
            {list.length === 1 ? (
                list[0]
            ) : (
                <ul className="mb-0 ps-3">
                    {list.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}
        </Alert>
    );
}
