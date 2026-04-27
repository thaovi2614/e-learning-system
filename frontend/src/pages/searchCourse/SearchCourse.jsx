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

    const listRef = useRef(null);
    const navigate = useNavigate();

    const kw = searchParams.get("kw") || "";

    async function fetchData(p = 1, shouldScroll = false) {
        const res = await getCourses({
            name: kw,
            page: p,
            size: 5
        });

        setCourses(res.data.items);
        setTotalCourses(res.data.total);
        setTotalPages(res.data.total_pages);
        setPage(p);

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
    }, [kw]);

    return (
        <div className="search-container">
            {/* 🔥 Title */}
            <h2 className="section-title" ref={listRef}>
                {totalCourses} kết quả cho "{kw}"
            </h2>

            {/* 🔥 List */}
            <CourseList
                courses={courses}
                onClick={(id) => navigate(`/courses/${id}`)}
            />

            {/* 🔥 Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchData(p, true)}
            />
        </div>
    );
}