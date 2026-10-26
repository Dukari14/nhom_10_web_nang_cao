import { useEffect, useState } from 'react';
import { Alert, Breadcrumb, Button, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ErrorAlert from '../components/ErrorAlert';
import { OrderProgress, OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import { getErrorMessages, isCanceled } from '../utils/errors';
import { formatDateTime, formatPrice, getOrderItemName } from '../utils/format';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function OrderDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    useDocumentTitle(order ? `Đơn #${order.order_id}` : 'Chi tiết đơn hàng');

    // Chỉ hiện lời chúc mừng khi vừa đặt xong (state do trang thanh toán truyền sang)
    const [justOrdered] = useState(Boolean(location.state && location.state.justOrdered));

    // Xóa state khỏi lịch sử trình duyệt để tải lại trang không hiện lại lời chúc mừng
    useEffect(() => {
        if (justOrdered) navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setErrors([]);
        api.get(`/orders/${id}`, { signal: controller.signal })
            .then((response) => {
                setOrder(response.data);
                setLoading(false);
            })
            .catch((error) => {
                if (isCanceled(error)) return;
                setOrder(null);
                setErrors(getErrorMessages(error));
                setLoading(false);
            });
        return () => controller.abort();
    }, [id]);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải đơn hàng...</span>
                </Spinner>
            </Container>
        );
    }

    if (!order) {
        return (
            <Container className="py-4">
                <ErrorAlert messages={errors} />
                <Button as={Link} to="/orders" variant="outline-primary">
                    Về danh sách đơn hàng
                </Button>
            </Container>
        );
    }

    const payment = order.payment;

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: 'small' }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                    Trang chủ
                </Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/orders' }}>
                    Đơn hàng của tôi
                </Breadcrumb.Item>
                <Breadcrumb.Item active>Đơn #{order.order_id}</Breadcrumb.Item>
            </Breadcrumb>

            {justOrdered && (
                <Alert variant="success">
                    Đặt hàng thành công! Mã đơn của bạn là <strong>#{order.order_id}</strong>.
                    {payment && payment.payment_method === 'BANK_TRANSFER' && (
                        <> Vui lòng chuyển khoản và ghi mã đơn vào nội dung chuyển khoản.</>
                    )}
                </Alert>
            )}

            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <h1 className="fs-3 fw-bold mb-0">Đơn #{order.order_id}</h1>
                <OrderStatusBadge status={order.status} />
                <span className="text-secondary small">Đặt ngày {formatDateTime(order.created_at)}</span>
            </div>

            <Card className="mb-3">
                <Card.Body>
                    {order.status === 'cancelled' ? (
                        <p className="mb-0">Đơn hàng này đã được hủy.</p>
                    ) : (
                        <OrderProgress status={order.status} />
                    )}
                </Card.Body>
            </Card>

            <Row className="g-4">
                <Col lg={8}>
                    <Card>
                        <Card.Body>
                            <h2 className="fs-5 fw-bold">Sản phẩm</h2>
                            <Table responsive className="align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">Sản phẩm</th>
                                        <th scope="col" className="text-end">
                                            Đơn giá
                                        </th>
                                        <th scope="col" className="text-center">
                                            SL
                                        </th>
                                        <th scope="col" className="text-end">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.order_item_id}>
                                            <td>
                                                <Link to={`/products/${item.product_id}`} className="text-decoration-none">
                                                    {getOrderItemName(item)}
                                                </Link>
                                            </td>
                                            <td className="text-end text-nowrap">{formatPrice(item.price)}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end text-nowrap">{formatPrice(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th scope="row" colSpan={3} className="text-end">
                                            Tổng cộng
                                        </th>
                                        <td className="text-end">
                                            <span className="price-current">{formatPrice(order.total_amount)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4} className="d-flex flex-column gap-3">
                    <Card>
                        <Card.Body>
                            <h2 className="fs-5 fw-bold">Giao hàng</h2>
                            <div>{order.shipping_address}</div>
                            <div className="text-secondary">Điện thoại: {order.phone}</div>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body className="d-flex flex-column gap-1">
                            <h2 className="fs-5 fw-bold">Thanh toán</h2>
                            {payment ? (
                                <>
                                    <div>{PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}</div>
                                    <div>
                                        <PaymentStatusBadge status={payment.status} />
                                    </div>
                                    <div className="text-secondary small">Số tiền: {formatPrice(payment.amount)}</div>
                                </>
                            ) : (
                                <div className="text-secondary">Chưa có thông tin thanh toán.</div>
                            )}
                        </Card.Body>
                    </Card>
                    <Button as={Link} to="/orders" variant="outline-primary">
                        Về danh sách đơn hàng
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
