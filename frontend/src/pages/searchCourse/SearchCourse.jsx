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

    const listRef = useRef(null);
    const navigate = useNavigate();

    const kw = searchParams.get("kw") || "";

    async function fetchData(p = 1, shouldScroll = false) {
        setLoading(true);
        try {
            const res = await getCourses({ name: kw, page: p, size: 5 });
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