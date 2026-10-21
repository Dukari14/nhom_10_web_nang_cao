import { useState, useEffect } from 'react';
import './css/HomeScreenBanner.css';

// Import các hình ảnh
import banner1 from '../../image/banner/0011930_1320x420.jpeg';
import banner2 from '../../image/banner/collection_banner2.webp';
import banner3 from '../../image/banner/collection_banner4.webp';
import banner5 from '../../image/banner/slide_1_img.webp';
import banner6 from '../../image/banner/slide_3_img.webp';
import banner7 from '../../image/banner/slide_4_img.webp';
import banner8 from '../../image/banner/slide_7_img.webp';

const slides = [
    { id: 1, image: banner1, title: "Siêu Sale 11.11" },
    { id: 2, image: banner2, title: "Bộ sưu tập mới" },
    { id: 3, image: banner3, title: "Khuyến mãi hot" },
    { id: 4, image: banner5, title: "Ưu đãi đặc biệt" },
    { id: 5, image: banner6, title: "Mua ngay hôm nay" },
    { id: 6, image: banner7, title: "Giảm giá sốc" },
    { id: 7, image: banner8, title: "Khám phá ngay" }
];

export default function HomeScreenBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Hàm để chuyển sang slide trước
    const prevSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
    };

    // Hàm để chuyển sang slide tiếp theo
    const nextSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Hàm tự động chuyển slide sau mỗi 8 giây
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 8000);

        return () => clearInterval(timer);
    }, [currentIndex]);

    const currentSlide = slides[currentIndex];

    return (
        <section className="banner">
            {/* Nút mũi tên trái */}
            <button className="carousel-arrow left-arrow" onClick={prevSlide}>
                &#10094;
            </button>
            
            {/* Nội dung ảnh Banner */}
            <div className="banner-content">
                <img 
                    src={currentSlide.image} 
                    alt={currentSlide.title} 
                    className="banner-image" 
                />
            </div>
            
            {/* Nút mũi tên phải */}
            <button className="carousel-arrow right-arrow" onClick={nextSlide}>
                &#10095;
            </button>
            
            {/* Vạch chuyển slide */}
            <div className="carousel-indicators">
                {slides.map((_, index) => (
                    <span 
                        key={index} 
                        className={`indicator ${currentIndex === index ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        style={{ cursor: 'pointer' }}
                    ></span>
                ))}
            </div>
        </section>
    );
}