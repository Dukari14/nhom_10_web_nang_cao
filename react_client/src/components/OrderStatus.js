import { Badge } from 'react-bootstrap';
import {
    ORDER_STATUS_LABELS,
    ORDER_STATUS_STEPS,
    ORDER_STATUS_VARIANTS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_VARIANTS,
} from '../utils/constants';

export function OrderStatusBadge({ status }) {
    return (
        <Badge bg={ORDER_STATUS_VARIANTS[status] || 'secondary'} text={status === 'pending' ? 'dark' : undefined}>
            {ORDER_STATUS_LABELS[status] || status}
        </Badge>
    );
}

export function PaymentStatusBadge({ status }) {
    return (
        <Badge bg={PAYMENT_STATUS_VARIANTS[status] || 'secondary'} text={status === 'pending' ? 'dark' : undefined}>
            {PAYMENT_STATUS_LABELS[status] || status}
        </Badge>
    );
}

// Thanh tiến trình: Chờ xác nhận → Đang xử lý → Đang giao → Đã giao. Đơn đã hủy không hiện thanh này.
export function OrderProgress({ status }) {
    if (status === 'cancelled') return null;
    const current = ORDER_STATUS_STEPS.indexOf(status);

    return (
        <ol className="order-steps" aria-label="Tiến trình đơn hàng">
            {ORDER_STATUS_STEPS.map((step, index) => {
                const state = index < current ? 'is-done' : index === current ? 'is-current' : '';
                return (
                    <li key={step} className={state} aria-current={index === current ? 'step' : undefined}>
                        <span className="step-dot" aria-hidden="true">
                            {index < current ? '✓' : index + 1}
                        </span>
                        <div>{ORDER_STATUS_LABELS[step]}</div>
                    </li>
                );
            })}
        </ol>
    );
}
