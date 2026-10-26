import { Pagination } from 'react-bootstrap';

// Trả về dãy số trang kèm dấu "..." : 1 ... 4 5 [6] 7 8 ... 20
function getPageList(current, total) {
    const pages = new Set([1, total]);
    for (let page = current - 2; page <= current + 2; page++) {
        if (page >= 1 && page <= total) pages.add(page);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((page, index) => {
        if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
        result.push(page);
    });
    return result;
}

export default function AppPagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;

    return (
        <Pagination className="justify-content-center flex-wrap mb-0" aria-label="Phân trang kết quả">
            <Pagination.Item aria-label="Trang trước" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                Trước
            </Pagination.Item>
            {getPageList(page, totalPages).map((item) =>
                typeof item === 'string' ? (
                    <Pagination.Ellipsis key={item} disabled />
                ) : (
                    <Pagination.Item
                        key={item}
                        active={item === page}
                        aria-label={`Trang ${item}`}
                        aria-current={item === page ? 'page' : undefined}
                        onClick={() => onChange(item)}
                    >
                        {item}
                    </Pagination.Item>
                ),
            )}
            <Pagination.Item aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
                Sau
            </Pagination.Item>
        </Pagination>
    );
}
