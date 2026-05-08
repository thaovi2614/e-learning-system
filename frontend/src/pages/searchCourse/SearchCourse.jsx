import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./searchCourse.css";

export default function SearchCourse() {
    const [searchParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const listRef = useRef(null);
    const navigate = useNavigate();

    const kw = searchParams.get("kw") || "";

    async function fetchData(p = 1, shouldScroll = false) {
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);

        //  Kiểm tra số âm
        if ((minPrice && min < 0) || (maxPrice && max < 0)) {
            alert("Giá không được là số âm");
            return;
        }

        //  Kiểm tra Tối đa < Tối thiểu
        if (minPrice && maxPrice && max < min) {
            alert("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu");
            return;
        }
        setLoading(true);
        try {
            const res = await getCourses({ name: kw, page: p, size: 5, min_price: minPrice, max_price: maxPrice  });
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
                <div className="price-filter-box" style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <span>Khoảng giá:</span>
                <input 
                    type="number" 
                    placeholder="Tối thiểu" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', width: '120px' }}
                />
                <span>-</span>
                <input 
                    type="number" 
                    placeholder="Tối đa" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', width: '120px' }}
                />
                <button 
                    onClick={() => fetchData(1)} 
                    style={{ padding: '5px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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