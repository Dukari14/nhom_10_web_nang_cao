import { Button, Modal, Spinner } from 'react-bootstrap';
import ErrorAlert from '../ErrorAlert';

// Hộp xác nhận ngay trên trang (không dùng popup của trình duyệt).
// Lỗi từ server hiện trong hộp để người dùng đọc được lý do.
export default function ConfirmModal({
    show,
    title,
    children,
    confirmLabel = 'Xác nhận',
    confirmVariant = 'primary',
    busy = false,
    errors = [],
    onConfirm,
    onCancel,
}) {
    return (
        <Modal show={show} onHide={busy ? undefined : onCancel} centered backdrop={busy ? 'static' : true}>
            <Modal.Header closeButton={!busy}>
                <Modal.Title as="h2" className="fs-5">
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ErrorAlert messages={errors} />
                {children}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>
                    Hủy bỏ
                </Button>
                <Button variant={confirmVariant} onClick={onConfirm} disabled={busy}>
                    {busy ? <Spinner size="sm" animation="border" role="status" aria-label="Đang xử lý" /> : confirmLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
