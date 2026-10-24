import { useState } from 'react';
import { Alert, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import AppPagination from '../../components/AppPagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ErrorAlert from '../../components/ErrorAlert';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/OrderStatus';
import PageSpinner from '../../components/PageSpinner';
import api from '../../api';
import { ADMIN_PAGE_SIZE, ORDER_STATUS_LABELS, ORDER_TRANSITIONS, PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { getErrorMessages } from '../../utils/errors';
import { formatDate, formatPrice, getOrderItemName } from '../../utils/format';
import useDocumentTitle from '../../utils/useDocumentTitle';
import useFetch from '../../utils/useFetch';

export default function AdminOrdersPage() {
    useDocumentTitle('Quản lý đơn hàng');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [choice, setChoice] = useState({}); // order_id -> trạng thái mới đang chọn
    const [busyId, setBusyId] = useState(null);
    const [actionErrors, setActionErrors] = useState([]);
    const [notice, setNotice] = useState('');
    const [cancelTarget, setCancelTarget] = useState(null);
    const [detail, setDetail] = useState(null);

    const { data, loading, errors, reload } = useFetch('/admin/orders', {
        status: status || undefined,
        page,
        limit: ADMIN_PAGE_SIZE,
    });

    const changeStatus = async (order, nextStatus) => {
        setBusyId(order.order_id);
        setActionErrors([]);
        setNotice('');
        try {
            await api.patch(`/admin/orders/${order.order_id}/status`, { status: nextStatus });
            setNotice(`Đã chuyển đơn #${order.order_id} sang "${ORDER_STATUS_LABELS[nextStatus]}".`);
            setChoice((previous) => ({ ...previous, [order.order_id]: '' }));
            setCancelTarget(null);
            reload();
        } catch (error) {
            setActionErrors(getErrorMessages(error));
            // Có thể đơn vừa được người khác đổi trạng thái, tải lại để thấy trạng thái mới
            reload();
        } finally {
            setBusyId(null);
        }
    };

    const handleSave = (order) => {
        const next = choice[order.order_id];
        if (!next) return;
        // Hủy đơn hoàn lại tồn kho và không hoàn tác được nên hỏi lại
        if (next === 'cancelled') {
            setActionErrors([]);
            setCancelTarget(order);
        } else {
            changeStatus(order, next);
        }
    };

    return (
        <>
            <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
                <h1 className="fs-3 fw-bold mb-0 me-auto">Quản lý đơn hàng</h1>
                <Form.Group controlId="order-status-filter">
                    <Form.Label className="small text-secondary mb-1">Trạng thái</Form.Label>
                    <Form.Select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Tất cả</option>
                        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </div>

            <ErrorAlert messages={errors} />
            <ErrorAlert messages={actionErrors} onClose={() => setActionErrors([])} />
            {notice && (
                <Alert variant="success" dismissible onClose={() => setNotice('')}>
                    {notice}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {loading && !data && <PageSpinner label="Đang tải đơn hàng..." />}

                    {data && data.items.length === 0 && (
                        <p className="text-secondary mb-0">Không có đơn hàng nào{status ? ' ở trạng thái này' : ''}.</p>
                    )}

                    {data && data.items.length > 0 && (
                        <>
                            <Table responsive hover className="align-middle mb-3" aria-busy={loading}>
                                <thead>
                                    <tr>
                                        <th scope="col">Mã đơn</th>
                                        <th scope="col">Khách hàng</th>
                                        <th scope="col">Ngày đặt</th>
                                        <th scope="col" className="text-end">
                                            Tổng tiền
                                        </th>
                                        <th scope="col">Thanh toán</th>
                                        <th scope="col">Trạng thái</th>
                                        <th scope="col">Cập nhật</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((order) => {
                                        const options = ORDER_TRANSITIONS[order.status] || [];
                                        const busy = busyId === order.order_id;
                                        return (
                                            <tr key={order.order_id}>
                                                <td>
                                                    <Button variant="link" className="p-0" onClick={() => setDetail(order)}>
                                                        #{order.order_id}
                                                    </Button>
                                                </td>
                                                <td>
                                                    <div>{order.customer.full_name || order.customer.email}</div>
                                                    <div className="text-secondary small">{order.customer.email}</div>
                                                </td>
                                                <td className="text-nowrap">{formatDate(order.created_at)}</td>
                                                <td className="text-end text-nowrap">{formatPrice(order.total_amount)}</td>
                                                <td>{order.payment && <PaymentStatusBadge status={order.payment.status} />}</td>
                                                <td>
                                                    <OrderStatusBadge status={order.status} />
                                                </td>
                                                <td style={{ minWidth: 230 }}>
                                                    {options.length === 0 ? (
                                                        <span className="text-secondary small">Đã kết thúc</span>
                                                    ) : (
                                                        <div className="d-flex gap-2">
                                                            <Form.Select
                                                                size="sm"
                                                                aria-label={`Trạng thái mới của đơn #${order.order_id}`}
                                                                value={choice[order.order_id] || ''}
                                                                disabled={busy}
                                                                onChange={(event) =>
                                                                    setChoice((previous) => ({
                                                                        ...previous,
                                                                        [order.order_id]: event.target.value,
                                                                    }))
                                                                }
                                                            >
                                                                <option value="">Chọn trạng thái...</option>
                                                                {options.map((next) => (
                                                                    <option key={next} value={next}>
                                                                        {ORDER_STATUS_LABELS[next]}
                                                                    </option>
                                                                ))}
                                                            </Form.Select>
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                disabled={busy || !choice[order.order_id]}
                                                                onClick={() => handleSave(order)}
                                                                aria-label={`Lưu trạng thái đơn #${order.order_id}`}
                                                            >
                                                                {busy && <Spinner size="sm" animation="border" role="status" aria-label="Đang lưu" />}
                                                                Lưu
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            <p className="text-secondary small">
                                Luồng trạng thái: Chờ xác nhận, Đang xử lý, Đang giao, Đã giao; hủy được khi chưa giao.
                                Tổng {data.total} đơn.
                            </p>
                            <AppPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                        </>
                    )}
                </Card.Body>
            </Card>

            <ConfirmModal
                show={Boolean(cancelTarget)}
                title={cancelTarget ? `Hủy đơn #${cancelTarget.order_id}?` : ''}
                confirmLabel="Hủy đơn"
                confirmVariant="danger"
                busy={busyId !== null}
                errors={actionErrors}
                onConfirm={() => changeStatus(cancelTarget, 'cancelled')}
                onCancel={() => setCancelTarget(null)}
            >
                Đơn hàng sẽ chuyển sang "Đã hủy" và số lượng sản phẩm được trả lại kho. Thao tác này không thể hoàn tác.
            </ConfirmModal>

            <Modal show={Boolean(detail)} onHide={() => setDetail(null)} centered size="lg">
                {detail && (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title as="h2" className="fs-5">
                                Chi tiết đơn #{detail.order_id}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p className="mb-1">
                                <strong>Khách hàng:</strong> {detail.customer.full_name || detail.customer.email} (
                                {detail.customer.email})
                            </p>
                            <p className="mb-1">
                                <strong>Giao tới:</strong> {detail.shipping_address} — {detail.phone}
                            </p>
                            <p>
                                <strong>Thanh toán:</strong>{' '}
                                {detail.payment
                                    ? `${PAYMENT_METHOD_LABELS[detail.payment.payment_method] || detail.payment.payment_method}`
                                    : 'Chưa có'}
                            </p>
                            <Table responsive size="sm" className="mb-0">
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
                                    {detail.items.map((item) => (
                                        <tr key={item.order_item_id}>
                                            <td>{getOrderItemName(item)}</td>
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
                                        <td className="text-end fw-bold">{formatPrice(detail.total_amount)}</td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </>
    );
}
