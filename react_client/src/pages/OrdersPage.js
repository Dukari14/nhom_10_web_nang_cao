import { useEffect, useState } from 'react';
import { Button, Card, Container, Nav, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { ORDER_STATUS_LABELS } from '../utils/constants';
import { getErrorMessages, isCanceled } from '../utils/errors';
import { formatDateTime, formatPrice, getOrderItemsSummary } from '../utils/format';
import useDocumentTitle from '../utils/useDocumentTitle';

const TABS = [{ key: 'all', label: 'Tất cả' }, ...Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({ key, label }))];

// Lịch sử đơn hàng của tôi, mới nhất trước (server đã sắp xếp)
export default function OrdersPage() {
    const [orders, setOrders] = useState(null);
    const [errors, setErrors] = useState([]);
    const [tab, setTab] = useState('all');
    const [reloadKey, setReloadKey] = useState(0);
    useDocumentTitle('Đơn hàng của tôi');

    useEffect(() => {
        const controller = new AbortController();
        setErrors([]);
        api.get('/orders', { signal: controller.signal })
            .then((response) => setOrders(response.data))
            .catch((error) => {
                if (!isCanceled(error)) setErrors(getErrorMessages(error));
            });
        return () => controller.abort();
    }, [reloadKey]);

    if (orders === null && errors.length === 0) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải đơn hàng...</span>
                </Spinner>
            </Container>
        );
    }

    if (orders === null) {
        return (
            <Container className="py-4">
                <ErrorAlert messages={errors} />
                <Button variant="outline-primary" onClick={() => setReloadKey((key) => key + 1)}>
                    Thử lại
                </Button>
            </Container>
        );
    }

    const visible = tab === 'all' ? orders : orders.filter((order) => order.status === tab);
    const countOf = (key) => (key === 'all' ? orders.length : orders.filter((order) => order.status === key).length);

    return (
        <Container className="py-4">
            <h1 className="fs-3 fw-bold mb-3">Đơn hàng của tôi</h1>

            {orders.length === 0 ? (
                <EmptyState message="Bạn chưa có đơn hàng nào." actionLabel="Xem điện thoại" to="/products" />
            ) : (
                <>
                    <Nav variant="pills" className="flex-nowrap overflow-auto pb-2 mb-3 gap-1" aria-label="Lọc đơn hàng theo trạng thái">
                        {TABS.map(({ key, label }) => (
                            <Nav.Item key={key}>
                                <Nav.Link as="button" type="button" active={tab === key} className="text-nowrap" onClick={() => setTab(key)}>
                                    {label} ({countOf(key)})
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>

                    {visible.length === 0 && (
                        <EmptyState
                            message="Không có đơn hàng nào ở trạng thái này."
                            actionLabel="Xem tất cả đơn"
                            onAction={() => setTab('all')}
                        />
                    )}

                    <div className="d-flex flex-column gap-3">
                        {visible.map((order) => (
                            <Card key={order.order_id}>
                                <Card.Body className="d-flex flex-column flex-md-row gap-2 gap-md-3 align-items-md-center">
                                    <div className="flex-grow-1">
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <strong>Đơn #{order.order_id}</strong>
                                            <span className="text-secondary small">Đặt ngày {formatDateTime(order.created_at)}</span>
                                        </div>
                                        <div className="text-secondary small">{getOrderItemsSummary(order)}</div>
                                    </div>
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <OrderStatusBadge status={order.status} />
                                        {order.payment && <PaymentStatusBadge status={order.payment.status} />}
                                        <span className="price-current">{formatPrice(order.total_amount)}</span>
                                        <Button as={Link} to={`/orders/${order.order_id}`} variant="outline-primary" size="sm">
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </Container>
    );
}
