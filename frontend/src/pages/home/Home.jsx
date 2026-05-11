import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./home.css";

export default function Home() {
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [level, setLevel] = useState(""); 
    const [tempLevel, setTempLevel] = useState("");
    const MAX_PRICE = 10000000;


    const listRef = useRef(null);
    const navigate = useNavigate();

    const fetchData = useCallback(async (p = 1, shouldScroll = false) => {
        const res = await getCourses({ page: p, size: 5, min_price: minPrice, max_price: maxPrice, level: level});
        setCourses(res.data.items);
        setTotalPages(res.data.total_pages);
        setPage(p);

        if (shouldScroll) {
            setTimeout(() => {
                listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [minPrice, maxPrice, level]);

    useEffect(() => {
        fetchData(1);
    }, []);

    const filterCourse = () => {
        fetchData(1);
    }

    function formattedPrice(price) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    }

    const highlight = courses[0];

    return (
        <div className="home-container">

            {/* ===== HERO ===== */}
            {highlight && (
                <div className="home-hero" onClick={() => navigate(`/courses/${highlight.id}`)}>
                    <img className="home-hero-img" src={highlight.thumbnail} alt="" />
                    <div className="home-hero-overlay" />
                    <div className="home-hero-content">
                        <span className="home-hero-badge">⭐ Nổi bật</span>
                        <h2 className="home-hero-title">{highlight.name}</h2>
                        <p className="home-hero-subtitle">{highlight.subtitle}</p>
                        <div className="home-hero-footer">
                            <span className="home-hero-price">
                                {highlight.price === 0 ? "Miễn phí" : formattedPrice(highlight.price)}
                            </span>
                            <button className="home-hero-btn">Xem ngay →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== COURSE LIST ===== */}
            <div ref={listRef}>
                <div className="section-header">
                    <h2 className="section-title">Tất cả khóa học</h2>
                </div>
                
                {/* ===== FILTER GIÁ ===== */}
                <div className="price-filter-box">
                    <span className="price-filter-label">Khoảng giá:</span>
                    <div className="price-range-display">
                        <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                        <span> — </span>
                        <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="range-slider-wrapper">
                        <input
                            type="range" min={0} max={MAX_PRICE} step={100000}
                            value={priceRange[0]}
                            onChange={(e) => {
                                const val = Math.min(Number(e.target.value), priceRange[1] - 100000);
                                setPriceRange([val, priceRange[1]]);
                                setMinPrice(val);
                            }}
                            className="range-input range-min"
                        />
                        <input
                            type="range" min={0} max={MAX_PRICE} step={100000}
                            value={priceRange[1]}
                            onChange={(e) => {
                                const val = Math.max(Number(e.target.value), priceRange[0] + 100000);
                                setPriceRange([priceRange[0], val]);
                                setMaxPrice(val);
                            }}
                            className="range-input range-max"
                        />
                        <div
                            className="range-track-fill"
                            style={{
                                left: `${(priceRange[0] / MAX_PRICE) * 100}%`,
                                width: `${((priceRange[1] - priceRange[0]) / MAX_PRICE) * 100}%`,
                            }}
                        />
                    </div>
                        {/* THÊM GIAO DIỆN LỌC LEVEL */}
                    <div className="level-filter-box">
                        <span className="price-filter-label">Trình độ:</span>
                        <div className="level-options">
                            {[
                                { value: "", label: "Tất cả" },
                                { value: "beginner", label: "Cơ bản" },
                                { value: "intermediate", label: "Trung cấp" },
                                { value: "advanced", label: "Nâng cao" },
                            ].map((opt) => (
                                <div className="form-check" key={opt.value}>
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="levelFilter"
                                        id={`level-${opt.value}`}
                                        value={opt.value}
                                        checked={level === opt.value}
                                        onChange={() => setLevel(opt.value)}
                                    />
                                    <label className="form-check-label" htmlFor={`level-${opt.value}`}>
                                        {opt.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="price-filter-actions">
                        <button
                            onClick={() => {
                                // setMinPrice(priceRange[0]);
                                // setMaxPrice(priceRange[1]);
                                // setLevel(tempLevel);
                                filterCourse()
                            }}
                            className="price-filter-btn"
                        >
                            Lọc
                        </button>
                        <button
                            onClick={() => {
                                setPriceRange([0, MAX_PRICE]);
                                setMinPrice("");
                                setMaxPrice("");
                                setLevel("");
                                // setTempLevel("");
                            }}
                            className="price-reset-btn"
                        >
                            Đặt lại
                        </button>
                    </div>
                </div>

                <CourseList courses={courses} onClick={(id) => navigate(`/courses/${id}`)} />
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
                <div className="home-pagination">
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={(p) => fetchData(p, true)}
                    />
                </div>
            )}
        </div>
    );
}