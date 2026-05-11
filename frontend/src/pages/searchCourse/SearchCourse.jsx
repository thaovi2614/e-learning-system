import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./searchCourse.css";
import { toast } from 'react-toastify';

export default function SearchCourse() {
    const [searchParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [level, setLevel] = useState("");
    // Thêm state
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const MAX_PRICE = 10000000;

    const listRef = useRef(null);
    const navigate = useNavigate();

    const kw = searchParams.get("kw") || "";

    async function fetchData(p = 1, shouldScroll = false) {
        // const min = parseFloat(minPrice);
        // const max = parseFloat(maxPrice);

        //  Kiểm tra số âm
        if ((minPrice && minPrice < 0) || (maxPrice && maxPrice < 0)) {
            toast.error("Giá không được là số âm");
            return;
        }

        //  Kiểm tra Tối đa < Tối thiểu
        if (minPrice && maxPrice && maxPrice < minPrice) {
            toast.error("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu");
            return;
        }
        setLoading(true);
        try {
            const res = await getCourses({ name: kw, page: p, size: 5, min_price: minPrice, max_price: maxPrice, level: level });
            setCourses(res.data.items);
            setTotalCourses(res.data.total);
            setTotalPages(res.data.total_pages);
            setPage(p);

            if (shouldScroll) {
                setTimeout(() => {
                    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData(1);
    }, [kw]);

    return (
        <div className="search-container">

            {/* ===== HEADER ===== */}
            <div className="search-header" ref={listRef}>
                <div className="search-meta">
                    <h2 className="search-count">
                        <span>{totalCourses}</span> kết quả
                    </h2>
                </div>
                <p className="search-keyword">
                    Tìm kiếm cho: <strong>"{kw}"</strong>
                </p>
                <br></br>
                <div className="price-filter-box">
                    <span className="price-filter-label">Khoảng giá:</span>

                    <div className="price-range-display">
                        <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                        <span> — </span>
                        <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                    </div>

                    <div className="range-slider-wrapper">
                        <input
                            type="range"
                            min={0}
                            max={MAX_PRICE}
                            step={100000}
                            value={priceRange[0]}
                            onChange={(e) => {
                                const val = Math.min(Number(e.target.value), priceRange[1] - 100000);
                                setPriceRange([val, priceRange[1]]);
                                setMinPrice(val);
                            }}
                            className="range-input range-min"
                        />
                        <input
                            type="range"
                            min={0}
                            max={MAX_PRICE}
                            step={100000}
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
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                        <span className="price-filter-label" style={{ marginRight: '10px' }}>Trình độ:</span>
                        <select 
                            value={level} 
                            onChange={(e) => setLevel(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '200px' }}
                        >
                            <option value="">Tất cả trình độ</option>
                            <option value="beginner">Beginner (Cơ bản)</option>
                            <option value="intermediate">Intermediate (Trung cấp)</option>
                            <option value="advanced">Advanced (Nâng cao)</option>
                        </select>
                    </div>        
                    <button
                        onClick={() => {
                            
                            
                            fetchData(1);
                        }}
                        className="price-filter-btn"
                    >
                        Lọc
                    </button>
                </div>
            </div>

            {/* ===== EMPTY STATE ===== */}
            {!loading && courses.length === 0 && (
                <div className="search-empty">
                    <span className="search-empty-icon">🔍</span>
                    <h3>Không tìm thấy kết quả</h3>
                    <p>Thử tìm kiếm với từ khóa khác</p>
                </div>
            )}

            {/* ===== LIST ===== */}
            {!loading && courses.length > 0 && (
                <CourseList
                    courses={courses}
                    onClick={(id) => navigate(`/courses/${id}`)}
                />
            )}

            {/* ===== LOADING ===== */}
            {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                    Đang tải...
                </div>
            )}

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
                <div className="search-pagination">
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