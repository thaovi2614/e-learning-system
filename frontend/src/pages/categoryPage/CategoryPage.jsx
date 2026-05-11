import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoryBySlug } from "../../services/categoryApi";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./categoryPage.css";
import { toast } from 'react-toastify';

export default function CategoryPage() {
    const { "*": slug } = useParams();

    const [courses, setCourses] = useState([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [categoryName, setCategoryName] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // THÊM STATE LỌC 
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [level, setLevel] = useState("")

    const listRef = useRef(null);
    const navigate = useNavigate();

    async function fetchData(p = 1, shouldScroll = false) {
        // KIỂM TRA ĐIỀU KIỆN NHẬP
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if ((minPrice && min < 0) || (maxPrice && max < 0)) {
            toast.error("Giá không thể là số âm");
            return;
        }
        if (minPrice && maxPrice && max < min) {
            toast.error("Giá tối đa phải thấp hơn giá tối thiểu");
            return;
        }

        setLoading(true);
        try {
            // GỬI THÊM min_price VÀ max_price
            const res = await getCourses({ 
                category: slug, 
                page: p, 
                size: 5,
                min_price: minPrice,
                max_price: maxPrice,
                level: level
            });
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
        // RESET GIÁ KHI ĐỔI DANH MỤC
        setMinPrice("");
        setMaxPrice("");
        setLevel("");
        fetchData(1);
        getCategoryBySlug({ slug }).then(res => {
            setCategoryName(res.data.name);
        });
    }, [slug]);

    return (
        <div className="category-container">

            {/* ===== HEADER ===== */}
            <div className="category-header" ref={listRef}>
                <h2 className="category-title">{categoryName || "..."}</h2>
                <p className="category-subtitle">
                    {totalCourses} khóa học trong danh mục này
                </p>
                
                {/* THÊM GIAO DIỆN LỌC GIÁ */}
                <div className="category-filter" style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span>Khoảng giá: </span>
		    <input 
                        type="number" 
                        placeholder="Tối thiểu" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '130px' }}
                    />
                    <span>-</span>
                    <input 
                        type="number" 
                        placeholder="Tối đa" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '130px' }}
                    />
                        <select 
                        value={level} 
                        onChange={(e) => setLevel(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="">Tất cả trình độ</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                    <button 
                        onClick={() => fetchData(1)}
                        style={{ padding: '8px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Lọc
                    </button>
                </div>
            </div>

            {/* ===== LOADING ===== */}
            {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                    Đang tải...
                </div>
            )}

            {/* ===== EMPTY ===== */}
            {!loading && courses.length === 0 && (
                <div className="category-empty">
                    <span className="category-empty-icon">📚</span>
                    <h3>Chưa có khóa học</h3>
                    <p>Danh mục này chưa có khóa học nào hoặc không tìm thấy trong tầm giá này</p>
                </div>
            )}

            {/* ===== LIST ===== */}
            {!loading && courses.length > 0 && (
                <CourseList
                    courses={courses}
                    onClick={(id) => navigate(`/courses/${id}`)}
                />
            )}

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
                <div className="category-pagination">
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