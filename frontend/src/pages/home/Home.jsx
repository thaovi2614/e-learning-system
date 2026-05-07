import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourses } from "../../services/courseApi";
import CourseList from "../../components/courseList/CourseList";
import Pagination from "../../components/paginate/Pagination";
import "./home.css";

export default function Home() {
    const [courses, setCourses] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const listRef = useRef(null);
    const navigate = useNavigate();

    async function fetchData(p = 1, shouldScroll = false) {
        const res = await getCourses({ page: p, size: 5 });
        setCourses(res.data.items);
        setTotalPages(res.data.total_pages);
        setPage(p);

        if (shouldScroll) {
            setTimeout(() => {
                listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }

    useEffect(() => {
        fetchData(1);
    }, []);

    function formattedPrice(price) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    }

    const highlight = courses[0];

    return (
        <div className="home-container">

            {/* ===== HERO ===== */}
            {highlight && (
                <div
                    className="home-hero"
                    onClick={() => navigate(`/courses/${highlight.id}`)}
                >
                    <img
                        className="home-hero-img"
                        src={highlight.thumbnail}
                        alt=""
                    />
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

                <CourseList
                    courses={courses}
                    onClick={(id) => navigate(`/courses/${id}`)}
                />
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