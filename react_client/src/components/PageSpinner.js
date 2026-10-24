import { Spinner } from 'react-bootstrap';

export default function PageSpinner({ label = 'Đang tải...' }) {
    return (
        <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">{label}</span>
            </Spinner>
        </div>
    );
}
