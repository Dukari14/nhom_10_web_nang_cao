import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import HomeScreenContent from './HomeScreenContent';
import useDocumentTitle from '../../utils/useDocumentTitle';
import { buildQuery } from '../../utils/query';

export default function HomeScreenPage() {
    const navigate = useNavigate();
    useDocumentTitle('Trang chủ');

    // Bấm Tìm kiếm thì chuyển sang trang danh sách kèm điều kiện trên URL
    const handleSearch = (values) => {
        navigate(`/products?${buildQuery(values)}`);
    };

    return (
        <>
            <section className="hero py-4 py-md-5" aria-labelledby="hero-title">
                <Container>
                    <h1 id="hero-title" className="fs-2 fw-bold">
                        Tìm chiếc điện thoại phù hợp với bạn
                    </h1>
                    <p className="hero-subtitle mb-3">
                        Hàng ngàn mẫu từ các thương hiệu hàng đầu, giao nhanh toàn quốc
                    </p>
                    <SearchBar showPrice onSearch={handleSearch} inputId="home-search" />
                </Container>
            </section>
            <HomeScreenContent />
        </>
    );
}
