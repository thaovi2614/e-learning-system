import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCourseById, getCoursesByCategory } from "../../services/courseApi";
import { createOrGetConversation } from "../../services/conversationApi";
import "./detailCourse.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function DetailCourse() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [course, setCourse] = useState(null);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [openChapter, setOpenChapter] = useState(null);
    const [relatedIndex, setRelatedIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const load = async () => {
            const res = await getCourseById(id);
            const courseData = res.data;

            setCourse(courseData);

            if (courseData.category_id) {
                const relatedRes = await getCoursesByCategory(
                    courseData.category_id,
                    Number(id)
                );

                setRelatedCourses(relatedRes.data.data.slice(0, 6));
            }
        };

        load();
    }, [id]);

    // ================= CAROUSEL AUTO PLAY =================
    useEffect(() => {
        if (relatedCourses.length <= 3) return;

        const timer = setInterval(() => {
            setRelatedIndex(prev => {
                const maxIndex = relatedCourses.length - 3;
                return prev >= maxIndex ? 0 : prev + 1;
            });
        }, 3000);

        return () => clearInterval(timer);
    }, [relatedCourses]);

    async function handleContactInstructor() {
        if (!user) {
            navigate("/login", {
                state: { from: location.pathname }
            });
            return;
        }

        try {
            const res = await createOrGetConversation(course.instructor_id);
            const conversationId = res.data.data.id;
            navigate(`/messages?conversation=${conversationId}`);
        } catch (err) {
            console.error(err);
        }
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
            case "VIDEO": return "🎥";
            case "SLIDE": return "📄";
            case "QUIZ":  return "📝";
            default:      return "📚";
        }
    }

    function handlePrev() {
        setRelatedIndex(prev =>
            prev === 0 ? relatedCourses.length - 3 : prev - 1
        );
    }

    function handleNext() {
        setRelatedIndex(prev => {
            const maxIndex = relatedCourses.length - 3;
            return prev >= maxIndex ? 0 : prev + 1;
        });
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
                                    <div
                                        className="chapter-header"
                                        onClick={() => toggleChapter(chapter.id)}
                                    >
                                        <span>{chapter.title}</span>
                                        <span>{openChapter === chapter.id ? "▲" : "▼"}</span>
                                    </div>

                                    {openChapter === chapter.id && (
                                        <div className="lesson-list">
                                            {chapter.lessons?.map(lesson => (
                                                <div key={lesson.id} className="lesson-item">
                                                    <span>{getLessonIcon(lesson.type)}</span>
                                                    {lesson.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ================= RELATED CAROUSEL ================= */}
                    {relatedCourses.length > 0 && (
                        <div className="section">
                            <h3>Các khóa học liên quan</h3>

                            <div className="related-wrapper">
                                <button
                                    className="related-btn"
                                    onClick={handlePrev}
                                    disabled={relatedCourses.length <= 3}
                                >
                                    ‹
                                </button>

                                <div className="related">
                                    {relatedCourses.slice(relatedIndex, relatedIndex + 3).map((c) => (
                                        <div
                                            key={c.id}
                                            className="related-item"
                                            onClick={() => navigate(`/courses/${c.id}`)}
                                        >
                                            <img src={c.thumbnail} alt="" />
                                            <div className="info">
                                                <div>{c.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="related-btn"
                                    onClick={handleNext}
                                    disabled={relatedCourses.length <= 3}
                                >
                                    ›
                                </button>
                            </div>

                            {relatedCourses.length > 3 && (
                                <div className="related-dots">
                                    {Array.from({ length: relatedCourses.length - 2 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`dot ${relatedIndex === i ? "active" : ""}`}
                                            onClick={() => setRelatedIndex(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* RIGHT */}
                <div className="right">
                    <img src={course.thumbnail} alt="" />

                    <h3>{formatPrice(course.price)}</h3>

                    <button onClick={handleAddToCart}>Thêm giỏ hàng</button>
                    <button>Mua ngay</button>
                    <button
                        className="contact-btn"
                        onClick={handleContactInstructor}
                    >
                        💬 Liên hệ giảng viên
                    </button>
                </div>
            </div>
        </div>
    );
}