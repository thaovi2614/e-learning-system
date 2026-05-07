import { useNavigate } from "react-router-dom";
import "./courseList.css";

export default function CourseList({ 
    courses, 
    highlightFirst = false,
    onCourseClick 
}) {
    const navigate = useNavigate();

    function formattedPrice(price) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(price);
    }

    const handleClick = (course) => {
        if (onCourseClick) {
            onCourseClick(course);
        } else {
            navigate(`/courses/${course.id}`);
        }
    };

    return (
        <>
            {highlightFirst && courses[0] && (
                <div
                    className="course-card highlight"
                    onClick={() => handleClick(courses[0])}
                >
                    <div className="thumbnail">
                        <img src={courses[0].thumbnail} alt="" />
                    </div>

                    <div className="course-content">
                        <h3>{courses[0].name}</h3>
                        <p>{courses[0].subtitle}</p>
                        <p>
                            {courses[0].price !== 0 ? formattedPrice(courses[0].price) : "Miễn phí"}
                        </p>
                    </div>
                </div>
            )}

            <div className="course-list">
                {courses.map((c, index) => {
                    if (highlightFirst && index === 0) return null;

                    return (
                        <div
                            key={c.id}
                            className="course-card"
                            onClick={() => handleClick(c)}
                        >
                            <div className="thumbnail">
                                <img src={c.thumbnail} alt="" />
                            </div>

                            <div className="course-content">
                                <h3>{c.name}</h3>
                                <p>{c.subtitle}</p>
                                <p>
                                    {c.price !== 0 ? formattedPrice(c.price) : "Miễn phí"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}