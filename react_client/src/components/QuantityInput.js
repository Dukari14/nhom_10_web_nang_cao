import { useEffect, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

// Ô chọn số lượng có nút − / +. Số lượng luôn nằm trong khoảng 1 đến max.
// Gõ số rồi rời ô hoặc nhấn Enter mới gửi lên server; nút − / + gửi ngay.
export default function QuantityInput({ id, value, max, disabled, onCommit }) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const clamp = (number) => Math.min(Math.max(1, max), Math.max(1, number));

    const commit = (number) => {
        const next = clamp(Math.floor(number));
        setDraft(String(next));
        if (next !== value) onCommit(next);
    };

    const handleBlur = () => {
        const number = Number(draft);
        if (draft.trim() === '' || Number.isNaN(number)) setDraft(String(value));
        else commit(number);
    };

    return (
        <InputGroup size="sm" style={{ maxWidth: 140 }}>
            <Button
                variant="outline-primary"
                aria-label="Giảm số lượng"
                disabled={disabled || value <= 1}
                onClick={() => commit(value - 1)}
            >
                −
            </Button>
            <Form.Control
                id={id}
                type="number"
                min={1}
                max={max}
                value={draft}
                disabled={disabled}
                aria-label="Số lượng"
                className="text-center"
                onChange={(event) => setDraft(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleBlur();
                    }
                }}
            />
            <Button
                variant="outline-primary"
                aria-label="Tăng số lượng"
                disabled={disabled || value >= max}
                onClick={() => commit(value + 1)}
            >
                +
            </Button>
        </InputGroup>
    );
}
