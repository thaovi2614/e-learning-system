import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoryBySlug } from "../../services/categoryApi";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./categoryPage.css";

export default function CategoryPage() {
    const { "*": slug } = useParams();

    const [courses, setCourses] = useState([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [categoryName, setCategoryName] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const listRef = useRef(null);
    const navigate = useNavigate();

    async function fetchData(p = 1, shouldScroll = false) {
        setLoading(true);
        try {
            const res = await getCourses({ category: slug, page: p, size: 5 });
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
                    <p>Danh mục này chưa có khóa học nào</p>
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