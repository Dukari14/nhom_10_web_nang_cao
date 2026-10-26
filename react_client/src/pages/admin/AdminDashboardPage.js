import { useState } from 'react';
import { Alert, Card, Col, Form, Row, Table } from 'react-bootstrap';
import BarChart from '../../components/admin/BarChart';
import ErrorAlert from '../../components/ErrorAlert';
import PageSpinner from '../../components/PageSpinner';
import { countDays, formatPeriodLabel, getDefaultRange } from '../../utils/dates';
import { formatPrice } from '../../utils/format';
import useDocumentTitle from '../../utils/useDocumentTitle';
import useFetch from '../../utils/useFetch';

const MAX_DAYS = 366;

// Tổng quan: doanh thu của các đơn đã giao trong khoảng ngày được chọn
export default function AdminDashboardPage() {
    useDocumentTitle('Tổng quan');
    const [range, setRange] = useState(() => getDefaultRange(30));
    const [groupBy, setGroupBy] = useState('day');

    // Kiểm tra khoảng ngày ở client trước, hợp lệ mới gọi API
    const days = countDays(range.from, range.to);
    let rangeError = '';
    if (!range.from || !range.to || Number.isNaN(days)) rangeError = 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc';
    else if (days < 1) rangeError = 'Ngày bắt đầu không được sau ngày kết thúc';
    else if (days > MAX_DAYS) rangeError = `Khoảng thời gian tối đa ${MAX_DAYS} ngày`;

    const { data, loading, errors } = useFetch(
        '/admin/stats',
        rangeError ? null : { from: range.from, to: range.to, groupBy },
    );

    const chartData = data
        ? data.series.map((point) => ({
              label: formatPeriodLabel(point.period),
              value: point.revenue,
              note: `${point.orders} đơn`,
          }))
        : [];

    return (
        <>
            <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
                <h1 className="fs-3 fw-bold mb-0 me-auto">Thống kê kinh doanh</h1>
                <Form.Group controlId="stats-from">
                    <Form.Label className="small text-secondary mb-1">Từ</Form.Label>
                    <Form.Control
                        type="date"
                        value={range.from}
                        max={range.to || undefined}
                        isInvalid={Boolean(rangeError)}
                        onChange={(event) => setRange((previous) => ({ ...previous, from: event.target.value }))}
                    />
                </Form.Group>
                <Form.Group controlId="stats-to">
                    <Form.Label className="small text-secondary mb-1">Đến</Form.Label>
                    <Form.Control
                        type="date"
                        value={range.to}
                        min={range.from || undefined}
                        isInvalid={Boolean(rangeError)}
                        onChange={(event) => setRange((previous) => ({ ...previous, to: event.target.value }))}
                    />
                </Form.Group>
                <Form.Group controlId="stats-group">
                    <Form.Label className="small text-secondary mb-1">Gom theo</Form.Label>
                    <Form.Select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                        <option value="day">Ngày</option>
                        <option value="month">Tháng</option>
                    </Form.Select>
                </Form.Group>
            </div>

            {rangeError && <Alert variant="warning">{rangeError}</Alert>}
            <ErrorAlert messages={errors} />
            {loading && !data && !rangeError && <PageSpinner label="Đang tải thống kê..." />}

            {data && !rangeError && (
                <div className="d-flex flex-column gap-3" aria-busy={loading}>
                    <p className="text-secondary small mb-0">
                        Doanh thu tính trên các đơn đã giao, theo ngày đặt hàng.
                    </p>
                    <Row xs={1} md={3} className="g-3">
                        <Col>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="text-secondary small">Tổng doanh thu</div>
                                    <div className="stat-value">{formatPrice(data.totals.revenue)}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="text-secondary small">Số điện thoại bán ra</div>
                                    <div className="stat-value">{data.totals.products_sold}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="text-secondary small">Số đơn hàng</div>
                                    <div className="stat-value">{data.totals.orders}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <h2 className="fs-5 fw-bold">Doanh thu theo {groupBy === 'month' ? 'tháng' : 'ngày'}</h2>
                            <BarChart
                                data={chartData}
                                ariaLabel={`Biểu đồ doanh thu theo ${groupBy === 'month' ? 'tháng' : 'ngày'}, tổng ${formatPrice(
                                    data.totals.revenue,
                                )}`}
                            />
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Body>
                            <h2 className="fs-5 fw-bold">Top 5 sản phẩm bán chạy</h2>
                            {data.top_products.length === 0 ? (
                                <p className="text-secondary mb-0">Chưa có đơn đã giao trong khoảng thời gian này.</p>
                            ) : (
                                <Table responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Sản phẩm</th>
                                            <th scope="col" className="text-end">
                                                Đã bán
                                            </th>
                                            <th scope="col" className="text-end">
                                                Doanh thu
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_products.map((product) => (
                                            <tr key={product.product_id}>
                                                <td>{product.name}</td>
                                                <td className="text-end">{product.quantity_sold}</td>
                                                <td className="text-end text-nowrap">{formatPrice(product.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            )}
        </>
    );
}
