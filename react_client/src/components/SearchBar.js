import { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { PRICE_RANGES } from '../utils/constants';

// Thanh tìm kiếm viền vàng. Trang chủ có thêm ô chọn khoảng giá (showPrice).
export default function SearchBar({ initialValue = '', showPrice = false, onSearch, inputId = 'search-keyword' }) {
    const [keyword, setKeyword] = useState(initialValue);
    const [priceIndex, setPriceIndex] = useState(0);

    // Đồng bộ khi từ khóa trên URL thay đổi (ví dụ bấm "Xóa bộ lọc")
    useEffect(() => {
        setKeyword(initialValue);
    }, [initialValue]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const range = PRICE_RANGES[priceIndex];
        onSearch({ search: keyword.trim(), minPrice: range.min, maxPrice: range.max });
    };

    return (
        <Form onSubmit={handleSubmit} role="search" className="search-bar">
            <Row className="g-1 align-items-stretch">
                <Col xs={12} md>
                    <Form.Label htmlFor={inputId} visuallyHidden>
                        Từ khóa tìm kiếm
                    </Form.Label>
                    <Form.Control
                        id={inputId}
                        type="search"
                        size="lg"
                        value={keyword}
                        maxLength={100}
                        placeholder="Tìm theo tên hoặc thương hiệu (iPhone, Samsung, Xiaomi...)"
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                </Col>
                {showPrice && (
                    <Col xs={12} md={3}>
                        <Form.Label htmlFor={`${inputId}-price`} visuallyHidden>
                            Khoảng giá
                        </Form.Label>
                        <Form.Select
                            id={`${inputId}-price`}
                            size="lg"
                            value={priceIndex}
                            onChange={(event) => setPriceIndex(Number(event.target.value))}
                        >
                            {PRICE_RANGES.map((range, index) => (
                                <option key={range.label} value={index}>
                                    {range.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                )}
                <Col xs={12} md="auto">
                    <Button type="submit" variant="primary" size="lg" className="w-100 h-100 px-4">
                        Tìm kiếm
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}
