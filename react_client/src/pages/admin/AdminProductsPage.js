import { useState } from 'react';
import { Alert, Button, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import api from '../../api';
import AppPagination from '../../components/AppPagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ProductForm from '../../components/admin/ProductForm';
import ErrorAlert from '../../components/ErrorAlert';
import PageSpinner from '../../components/PageSpinner';
import StatusBadge from '../../components/StatusBadge';
import { ADMIN_PAGE_SIZE } from '../../utils/constants';
import { getErrorMessages } from '../../utils/errors';
import { formatPrice, getDisplayName, getPriceInfo } from '../../utils/format';
import useDocumentTitle from '../../utils/useDocumentTitle';
import useFetch from '../../utils/useFetch';

export default function AdminProductsPage() {
    useDocumentTitle('Quản lý điện thoại');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null); // sản phẩm đang sửa, null = thêm mới
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState([]);
    const [notice, setNotice] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteErrors, setDeleteErrors] = useState([]);

    const { data, loading, errors, reload } = useFetch('/admin/products', {
        search: search || undefined,
        page,
        limit: ADMIN_PAGE_SIZE,
    });
    const { data: categories } = useFetch('/categories');

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const startEdit = (product) => {
        setEditing(product);
        setFormErrors([]);
        setNotice('');
    };

    const startCreate = () => {
        setEditing(null);
        setFormErrors([]);
        setNotice('');
    };

    const handleSubmit = async (payload) => {
        setSaving(true);
        setFormErrors([]);
        try {
            if (editing) {
                await api.patch(`/products/${editing.product_id}`, payload);
                setNotice(`Đã cập nhật sản phẩm #${editing.product_id}.`);
            } else {
                await api.post('/products', payload);
                setNotice('Đã thêm sản phẩm mới.');
            }
            setEditing(null);
            reload();
        } catch (error) {
            setFormErrors(getErrorMessages(error));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteErrors([]);
        try {
            await api.delete(`/products/${deleteTarget.product_id}`);
            setNotice(`Đã xóa sản phẩm "${getDisplayName(deleteTarget)}".`);
            if (editing && editing.product_id === deleteTarget.product_id) setEditing(null);
            setDeleteTarget(null);
            // Xóa dòng cuối của trang thì lùi về trang trước
            if (data && data.items.length === 1 && page > 1) setPage(page - 1);
            else reload();
        } catch (error) {
            // Ví dụ 409: sản phẩm đã có trong giỏ hoặc đơn hàng
            setDeleteErrors(getErrorMessages(error));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <h1 className="fs-3 fw-bold mb-0 me-auto">Quản lý điện thoại</h1>
                <Button variant="primary" onClick={startCreate}>
                    + Thêm sản phẩm
                </Button>
            </div>

            {notice && (
                <Alert variant="success" dismissible onClose={() => setNotice('')}>
                    {notice}
                </Alert>
            )}

            <Row className="g-3 align-items-start">
                <Col xl={7}>
                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleSearch} role="search" className="mb-3">
                                <InputGroup>
                                    <Form.Label htmlFor="admin-product-search" visuallyHidden>
                                        Tìm sản phẩm
                                    </Form.Label>
                                    <Form.Control
                                        id="admin-product-search"
                                        type="search"
                                        value={searchInput}
                                        placeholder="Tìm theo tên hoặc thương hiệu"
                                        maxLength={100}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                    />
                                    <Button type="submit" variant="outline-primary">
                                        Tìm
                                    </Button>
                                </InputGroup>
                            </Form>

                            <ErrorAlert messages={errors} />
                            {loading && !data && <PageSpinner label="Đang tải sản phẩm..." />}

                            {data && data.items.length === 0 && (
                                <p className="text-secondary mb-0">
                                    {search ? 'Không tìm thấy sản phẩm phù hợp.' : 'Chưa có sản phẩm nào.'}
                                </p>
                            )}

                            {data && data.items.length > 0 && (
                                <>
                                    <Table responsive hover className="align-middle mb-3" aria-busy={loading}>
                                        <thead>
                                            <tr>
                                                <th scope="col">ID</th>
                                                <th scope="col">Tên</th>
                                                <th scope="col" className="text-end">
                                                    Giá
                                                </th>
                                                <th scope="col" className="text-center">
                                                    Kho
                                                </th>
                                                <th scope="col">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((product) => {
                                                const price = getPriceInfo(product);
                                                return (
                                                    <tr key={product.product_id} className={editing && editing.product_id === product.product_id ? 'table-active' : ''}>
                                                        <td>{product.product_id}</td>
                                                        <td>
                                                            <div>{getDisplayName(product)}</div>
                                                            <div className="small text-secondary">
                                                                {[product.color, product.category && product.category.name].filter(Boolean).join(', ')}{' '}
                                                                {!product.is_active && <StatusBadge tone="gray">Đang ẩn</StatusBadge>}
                                                            </div>
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            <div>{formatPrice(price.current)}</div>
                                                            {price.hasDiscount && (
                                                                <div className="price-original">{formatPrice(price.original)}</div>
                                                            )}
                                                        </td>
                                                        <td className="text-center">{product.stock}</td>
                                                        <td className="text-nowrap">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="me-1"
                                                                aria-label={`Sửa ${getDisplayName(product)}`}
                                                                onClick={() => startEdit(product)}
                                                            >
                                                                Sửa
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                aria-label={`Xóa ${getDisplayName(product)}`}
                                                                onClick={() => {
                                                                    setDeleteErrors([]);
                                                                    setDeleteTarget(product);
                                                                }}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                    <p className="text-secondary small">Tổng {data.total} sản phẩm.</p>
                                    <AppPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={5}>
                    <ProductForm
                        product={editing}
                        categories={categories || []}
                        saving={saving}
                        serverErrors={formErrors}
                        onSubmit={handleSubmit}
                        onCancel={startCreate}
                    />
                </Col>
            </Row>

            <ConfirmModal
                show={Boolean(deleteTarget)}
                title="Xóa sản phẩm?"
                confirmLabel="Xóa"
                confirmVariant="danger"
                busy={deleting}
                errors={deleteErrors}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            >
                {deleteTarget && (
                    <>
                        Bạn sắp xóa <strong>{getDisplayName(deleteTarget)}</strong> (#{deleteTarget.product_id}). Thao tác này
                        không thể hoàn tác. Nếu sản phẩm đã có trong giỏ hàng hoặc đơn hàng, hãy bỏ chọn "Đang bán" để ẩn thay vì xóa.
                    </>
                )}
            </ConfirmModal>
        </>
    );
}
