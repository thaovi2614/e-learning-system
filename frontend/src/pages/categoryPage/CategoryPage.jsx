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
    const [categoryName, setCategoryName] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const listRef = useRef(null);
    const navigate = useNavigate();

    async function fetchData(p = 1, shouldScroll = false) {
        // 🔥 lấy courses theo category
        const res = await getCourses({
            category: slug,
            page: p,
            size: 5
        });

        setCourses(res.data.items);
        setTotalPages(res.data.total_pages);
        setPage(p);

        // 🔥 scroll
        if (shouldScroll) {
            setTimeout(() => {
                listRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 100);
        }
    }

    useEffect(() => {
        fetchData(1);

        // 🔥 lấy tên category
        getCategoryBySlug({ slug }).then(res => {
            setCategoryName(res.data.name);
        });

    }, [slug]);

    return (
        <div className="category-container">
            {/* 🔥 Title */}
            <h2 className="section-title" ref={listRef}>
                {categoryName}
            </h2>

            {/* 🔥 List */}
            <CourseList
                courses={courses}
                onClick={(id) => navigate(`/courses/${id}`)}
            />

            {/* 🔥 Empty */}
            {courses.length === 0 && (
                <p>Không có khóa học trong danh mục này</p>
            )}

            {/* 🔥 Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchData(p, true)}
            />
        </div>
    );
}