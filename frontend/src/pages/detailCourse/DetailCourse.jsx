import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCourseById } from "../../services/courseApi";
import "./detailCourse.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function DetailCourse() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [course, setCourse] = useState(null);
    const [openChapter, setOpenChapter] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchCourse();
    }, [id]);

    async function fetchCourse() {
        const res = await getCourseById(id);
        setCourse(res.data);
    }

    function toggleChapter(id) {
        setOpenChapter(prev => (prev === id ? null : id));
    }

    function handleAddToCart() {
        if (!user) {
            navigate("/login", {
                state: { from: location.pathname }
            });
            return;
        }

        addToCart(course.id);
    }

    function formatPrice(price) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    }

    function getLessonIcon(type) {
        switch (type) {
            case "VIDEO":
                return "🎥";
            case "SLIDE":
                return "📄";
            case "QUIZ":
                return "📝";
            default:
                return "📚";
        }
    }

    if (!course) return <div>Loading...</div>;

    return (
        <div className="detail-container">

            {/* HEADER */}
            <div className="course-header">
                <h1>{course.name}</h1>
                <p>{course.subtitle}</p>
            </div>

            <div className="course-body">

                {/* LEFT */}
                <div className="left">

                    <div className="section">
                        <h3>Giới thiệu khóa học</h3>
                        <p>{course.description}</p>
                    </div>

                    <div className="section">
                        <h3>Nội dung khóa học</h3>

                        <div className="chapter-list">
                            {course.chapters.map(chapter => (
                                <div key={chapter.id} className="chapter-item">

                                    {/* HEADER */}
                                    <div
                                        className="chapter-header"
                                        onClick={() => toggleChapter(chapter.id)}
                                    >
                                        <span>{chapter.title}</span>
                                        <span>{openChapter === chapter.id ? "▲" : "▼"}</span>
                                    </div>

                                    {/* LESSON LIST */}
                                    {openChapter === chapter.id && (
                                        <div className="lesson-list">
                                            {chapter.lessons?.map(lesson => (
                                                <div key={lesson.id} className="lesson-item">
                                                    <span>
                                                        {getLessonIcon(lesson.type)}
                                                    </span>
                                                    {lesson.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section">
                        <h3>Các khóa học liên quan</h3>
                        <div className="related">
                            <div>Khóa học 1</div>
                            <div>Khóa học 2</div>
                            <div>Khóa học 3</div>
                        </div>
                    </div>

                </div>

                {/* RIGHT */}
                <div className="right">
                    <img src={course.thumbnail} alt="" />

                    <h3>{formatPrice(course.price)}</h3>

                    <button onClick={() => handleAddToCart()}>Thêm giỏ hàng</button>
                    <button>Mua ngay</button>
                </div>
            </div>
        </div>
    );
}