import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import api from '../../api';
import AppPagination from '../../components/AppPagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ErrorAlert from '../../components/ErrorAlert';
import PageSpinner from '../../components/PageSpinner';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_PAGE_SIZE, ROLE_LABELS } from '../../utils/constants';
import { getErrorMessages } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import useDocumentTitle from '../../utils/useDocumentTitle';
import useFetch from '../../utils/useFetch';

export default function AdminUsersPage() {
    useDocumentTitle('Quản lý tài khoản');
    const { user: me } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [active, setActive] = useState('');
    const [page, setPage] = useState(1);
    const [notice, setNotice] = useState('');
    const [actionErrors, setActionErrors] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [confirm, setConfirm] = useState(null); // { user, change: { role } | { is_active } }

    const { data, loading, errors, reload } = useFetch('/admin/users', {
        search: search || undefined,
        role: role || undefined,
        is_active: active || undefined,
        page,
        limit: ADMIN_PAGE_SIZE,
    });

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const applyChange = async (target, change, message) => {
        setBusyId(target.user_id);
        setActionErrors([]);
        setNotice('');
        try {
            await api.patch(`/admin/users/${target.user_id}`, change);
            setNotice(message);
            setConfirm(null);
            reload();
        } catch (error) {
            // Ví dụ: server chặn admin tự khóa hoặc tự hạ quyền chính mình
            setActionErrors(getErrorMessages(error));
        } finally {
            setBusyId(null);
        }
    };

    const name = (user) => user.full_name || user.email;

    const confirmText = () => {
        if (!confirm) return { title: '', body: '', label: '', variant: 'primary' };
        const { user, change } = confirm;
        if ('role' in change) {
            return {
                title: 'Đổi vai trò?',
                body: `Đổi vai trò của ${name(user)} từ "${ROLE_LABELS[user.role]}" thành "${ROLE_LABELS[change.role]}".`,
                label: 'Đổi vai trò',
                variant: 'primary',
            };
        }
        return {
            title: 'Khóa tài khoản?',
            body: `${name(user)} sẽ không đăng nhập được nữa và phiên đang dùng bị đăng xuất ngay. Bạn có thể mở khóa lại bất cứ lúc nào.`,
            label: 'Khóa tài khoản',
            variant: 'danger',
        };
    };
    const texts = confirmText();

    return (
        <>
            <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
                <h1 className="fs-3 fw-bold mb-0 me-auto">Quản lý tài khoản người dùng</h1>
            </div>

            <Card className="summary-card mb-3">
                <Card.Body>
                    <Row className="g-2 align-items-end">
                        <Col md={6}>
                            <Form onSubmit={handleSearch} role="search">
                                <Form.Label htmlFor="admin-user-search" visuallyHidden>
                                    Tìm tài khoản
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        id="admin-user-search"
                                        type="search"
                                        value={searchInput}
                                        placeholder="Tìm theo email hoặc tên"
                                        maxLength={100}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                    />
                                    <Button type="submit" variant="outline-primary">
                                        Tìm
                                    </Button>
                                </InputGroup>
                            </Form>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Group controlId="admin-user-role">
                                <Form.Label className="small text-secondary mb-1">Vai trò</Form.Label>
                                <Form.Select
                                    value={role}
                                    onChange={(event) => {
                                        setRole(event.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">Tất cả</option>
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={6} md={3}>
                            <Form.Group controlId="admin-user-active">
                                <Form.Label className="small text-secondary mb-1">Trạng thái</Form.Label>
                                <Form.Select
                                    value={active}
                                    onChange={(event) => {
                                        setActive(event.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="true">Đang hoạt động</option>
                                    <option value="false">Đã bị khóa</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <ErrorAlert messages={errors} />
            <ErrorAlert messages={confirm ? [] : actionErrors} onClose={() => setActionErrors([])} />
            {notice && (
                <Alert variant="success" dismissible onClose={() => setNotice('')}>
                    {notice}
                </Alert>
            )}

            <Card className="summary-card">
                <Card.Body>
                    {loading && !data && <PageSpinner label="Đang tải tài khoản..." />}

                    {data && data.items.length === 0 && <p className="text-secondary mb-0">Không tìm thấy tài khoản nào.</p>}

                    {data && data.items.length > 0 && (
                        <>
                            <Table responsive hover className="align-middle mb-3" aria-busy={loading}>
                                <thead>
                                    <tr>
                                        <th scope="col">Họ tên</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Vai trò</th>
                                        <th scope="col">Ngày tạo</th>
                                        <th scope="col">Trạng thái</th>
                                        <th scope="col">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((user) => {
                                        const isMe = me && user.user_id === me.user_id;
                                        const busy = busyId === user.user_id;
                                        const nextRole = user.role === 'admin' ? 'customer' : 'admin';
                                        return (
                                            <tr key={user.user_id}>
                                                <td>
                                                    {user.full_name || '—'} {isMe && <span className="text-secondary small">(bạn)</span>}
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'}>{ROLE_LABELS[user.role]}</Badge>
                                                </td>
                                                <td className="text-nowrap">{formatDate(user.created_at)}</td>
                                                <td>
                                                    <Badge bg={user.is_active ? 'success' : 'danger'}>
                                                        {user.is_active ? 'Đang hoạt động' : 'Đã bị khóa'}
                                                    </Badge>
                                                </td>
                                                <td className="text-nowrap">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-1"
                                                        disabled={isMe || busy}
                                                        title={isMe ? 'Không thể đổi vai trò của chính mình' : undefined}
                                                        aria-label={`Đổi vai trò của ${name(user)}`}
                                                        onClick={() => {
                                                            setActionErrors([]);
                                                            setConfirm({ user, change: { role: nextRole } });
                                                        }}
                                                    >
                                                        Đổi vai trò
                                                    </Button>
                                                    {user.is_active ? (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            disabled={isMe || busy}
                                                            title={isMe ? 'Không thể khóa chính mình' : undefined}
                                                            aria-label={`Khóa tài khoản ${name(user)}`}
                                                            onClick={() => {
                                                                setActionErrors([]);
                                                                setConfirm({ user, change: { is_active: false } });
                                                            }}
                                                        >
                                                            Khóa
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            disabled={busy}
                                                            aria-label={`Mở khóa tài khoản ${name(user)}`}
                                                            onClick={() =>
                                                                applyChange(user, { is_active: true }, `Đã mở khóa tài khoản ${name(user)}.`)
                                                            }
                                                        >
                                                            Mở khóa
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            <p className="text-secondary small">Tổng {data.total} tài khoản.</p>
                            <AppPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                        </>
                    )}
                </Card.Body>
            </Card>

            <ConfirmModal
                show={Boolean(confirm)}
                title={texts.title}
                confirmLabel={texts.label}
                confirmVariant={texts.variant}
                busy={busyId !== null}
                errors={actionErrors}
                onConfirm={() =>
                    applyChange(
                        confirm.user,
                        confirm.change,
                        'role' in confirm.change
                            ? `Đã đổi vai trò của ${name(confirm.user)} thành "${ROLE_LABELS[confirm.change.role]}".`
                            : `Đã khóa tài khoản ${name(confirm.user)}.`,
                    )
                }
                onCancel={() => setConfirm(null)}
            >
                {texts.body}
            </ConfirmModal>
        </>
    );
}
