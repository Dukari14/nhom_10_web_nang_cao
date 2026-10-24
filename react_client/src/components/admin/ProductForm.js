import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import ErrorAlert from '../ErrorAlert';
import { EMPTY_PRODUCT_FORM, formToPayload, productToForm, validateProductForm } from '../../utils/productForm';

// Form thêm/sửa sản phẩm. product = null là thêm mới. onSubmit(payload) trả về Promise, lỗi ném ra để hiển thị.
export default function ProductForm({ product, categories, saving, serverErrors, onSubmit, onCancel }) {
    const isEdit = Boolean(product);
    const [values, setValues] = useState(EMPTY_PRODUCT_FORM);
    const [fieldErrors, setFieldErrors] = useState({});

    // Chọn sản phẩm khác để sửa (hoặc bấm thêm mới) thì nạp lại form
    useEffect(() => {
        setValues(product ? productToForm(product) : EMPTY_PRODUCT_FORM);
        setFieldErrors({});
    }, [product]);

    const set = (key) => (event) => setValues((previous) => ({ ...previous, [key]: event.target.value }));

    const handleSubmit = (event) => {
        event.preventDefault();
        const errors = validateProductForm(values);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        onSubmit(formToPayload(values, { isEdit }));
    };

    const text = (key, label, extra = {}) => (
        <Form.Group controlId={`product-${key}`}>
            <Form.Label className="fw-semibold">{label}</Form.Label>
            <Form.Control
                value={values[key]}
                isInvalid={Boolean(fieldErrors[key])}
                onChange={set(key)}
                disabled={saving}
                {...extra}
            />
            <Form.Control.Feedback type="invalid">{fieldErrors[key]}</Form.Control.Feedback>
        </Form.Group>
    );

    return (
        <Card className="summary-card">
            <Card.Body>
                <h2 className="fs-5 fw-bold mb-3">{isEdit ? `Sửa sản phẩm #${product.product_id}` : 'Thêm sản phẩm'}</h2>
                <ErrorAlert messages={serverErrors} />
                <Form noValidate onSubmit={handleSubmit}>
                    <Row className="g-2">
                        <Col xs={12}>
                            <Form.Group controlId="product-category_id">
                                <Form.Label className="fw-semibold">Danh mục</Form.Label>
                                <Form.Select
                                    value={values.category_id}
                                    isInvalid={Boolean(fieldErrors.category_id)}
                                    onChange={set('category_id')}
                                    disabled={saving}
                                >
                                    <option value="">Chọn danh mục...</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{fieldErrors.category_id}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>{text('name', 'Tên', { maxLength: 255, placeholder: 'Ví dụ: Galaxy S24 256GB' })}</Col>
                        <Col xs={6}>{text('brand', 'Hãng', { maxLength: 100 })}</Col>
                        <Col xs={6}>{text('color', 'Màu', { maxLength: 50 })}</Col>
                        <Col xs={6}>{text('ram', 'RAM', { maxLength: 20, placeholder: '8GB' })}</Col>
                        <Col xs={6}>{text('storage', 'Bộ nhớ', { maxLength: 20, placeholder: '256GB' })}</Col>
                        <Col xs={6}>{text('price', 'Giá (đ)', { type: 'number', min: 0, step: 1000 })}</Col>
                        <Col xs={6}>{text('sale_price', 'Giá khuyến mãi (đ)', { type: 'number', min: 0, step: 1000 })}</Col>
                        <Col xs={6}>{text('stock', 'Tồn kho', { type: 'number', min: 0, step: 1 })}</Col>
                        <Col xs={6}>{text('image_url', 'Đường dẫn ảnh', { maxLength: 255 })}</Col>
                        <Col xs={12}>
                            {text('slug', 'Slug (đường dẫn thân thiện)', {
                                maxLength: 255,
                                readOnly: isEdit,
                                placeholder: isEdit ? '' : 'Bỏ trống để tự tạo từ tên',
                            })}
                        </Col>
                        <Col xs={12}>{text('description', 'Mô tả', { as: 'textarea', rows: 2 })}</Col>
                        <Col xs={12}>
                            {text('config_description', 'Mô tả cấu hình', {
                                as: 'textarea',
                                rows: 3,
                                placeholder: 'Màn hình 6.2 inch; Chip Exynos 2400; Camera sau 50MP; Pin 4000 mAh',
                            })}
                            <Form.Text muted>Các mục cách nhau bằng dấu chấm phẩy (;).</Form.Text>
                        </Col>
                        <Col xs={12}>
                            <Form.Check
                                type="checkbox"
                                id="product-is_active"
                                label="Đang bán (hiển thị cho khách)"
                                checked={values.is_active}
                                disabled={saving}
                                onChange={(event) => setValues((previous) => ({ ...previous, is_active: event.target.checked }))}
                            />
                        </Col>
                    </Row>
                    <div className="d-flex gap-2 mt-3">
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? <Spinner size="sm" animation="border" role="status" aria-label="Đang lưu" /> : 'Lưu'}
                        </Button>
                        {isEdit && (
                            <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
                                Hủy sửa
                            </Button>
                        )}
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}
