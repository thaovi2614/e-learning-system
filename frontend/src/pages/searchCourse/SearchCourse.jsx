import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { getCourses } from "../../services/courseApi";
import "./searchCourse.css"

export default function SearchCourse() {
    const[searchParams] = useSearchParams();
    const[courses, setCourses] = useState([]);
    const[totalCourses, setTotalCourses] = useState(0);
    const[page, setPage] = useState(1);
    const[totalPages, setTotalPages] = useState(1);
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
        setTotalPages(res.data.total_pages)
        setPage(p);

        if (shouldScroll) {
            setTimeout(() => {
                listRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 100);
        }
    };

    useEffect(() => {
        fetchData(1, false)
    }, [kw]);

    function formattedPrice(price) {
        const formatted = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);

        return formatted;
    };

    return (
        <div className="search-container">
            <h2 className="section-title" ref={listRef}>{totalCourses} kết quả cho "{kw}"</h2>
            <div className="course-list">
                {courses.map(c => (
                    <div 
                        key={c.id} 
                        className="course-card"
                        onClick={() => navigate(`/courses/${c.id}`)}
                    >
                        <div className="thumbnail">
                            <img src={c.thumbnail} alt="" />
                        </div>
                        <div className="course-content">
                            <h3>{c.name}</h3>
                            <p>{c.subtitle}</p>
                            <p>{formattedPrice(c.price)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pagination">
                <button disabled={page === 1} onClick={() => fetchData(page - 1, true)}>
                    «
                </button>

                {[...Array(totalPages)].map((_, i) => (
                    <button
                        key={i}
                        className={page === i + 1 ? "active" : ""}
                        onClick={() => fetchData(i + 1, true)}
                    >
                        {i + 1}
                    </button>
                ))}

                <button disabled={page === totalPages} onClick={() => fetchData(page + 1, true)}>
                    »
                </button>
            </div>
        </div>
    );
}