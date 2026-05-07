import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCourseById, getCoursesByCategory } from "../../services/courseApi";
import { checkEnrollment, createEnrollment } from "../../services/enrollmentApi";
import { createOrGetConversation } from "../../services/conversationApi";
import { createMomoPayment } from "../../services/paymentApi";
import "./detailCourse.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function DetailCourse() {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [course, setCourse] = useState(null);
    const [isEnroll, setIsEnroll] = useState(false);
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

            if (user) {
                const enrollRes = await checkEnrollment(courseData.id);
                setIsEnroll(enrollRes.data.enrolled);
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
            toast.info("Bạn cần đăng nhập trước")
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
            toast.info("Bạn cần đăng nhập trước")
            return;
        }

        addToCart(course.id);
    }

    async function handleBuyNow() {
        if (!user) {
            navigate("/login", { state: { from: location.pathname } });
            toast.info("Bạn cần đăng nhập trước");
            return;
        }
        try {
            const res = await createMomoPayment([course.id]);
            if (res.data.payUrl) {
                window.location.href = res.data.payUrl;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể tạo thanh toán");
        }
    }

    async function handleEnroll() {
        if (!user) {
            navigate("/login", {
                state: { from: location.pathname }
            });
            toast.info("Bạn cần đăng nhập trước");
            return;
        }

        try {
            const res = await createEnrollment(id);
            if (res.data.success) {
                toast.success("Đăng ký khóa học thành công!");
                setIsEnroll(true);
            }
        } catch (err) {
            const msg = err.response?.data?.error;
            if (err.response?.status === 409) {
                toast.warning(msg || "Bạn đã đăng ký khóa học này rồi");
            } else {
                toast.error(msg || "Đăng ký thất bại");
            }
        }
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
                    {course.price !== 0 ? 
                        <h3>{formatPrice(course.price)}</h3>
                    : 
                        <h3>Miễn phí</h3>
                    }
                    

                    {isEnroll ? (
                        <button className="enrolled-btn" disabled>
                            ✅ Đã đăng ký
                        </button>
                    ) : (
                        <>
                            {course.price !== 0 ? 
                                <>
                                    <button onClick={handleAddToCart}>Thêm giỏ hàng</button>
                                    <button onClick={handleBuyNow}>Mua ngay</button>
                                </>
                            : 
                                <>
                                    <button onClick={handleEnroll}>Đăng ký ngay</button>
                                </>
                            }
                            
                        </>
                    )}

                    <button className="contact-btn" onClick={handleContactInstructor}>
                        💬 Liên hệ giảng viên
                    </button>
                </div>
            </div>
        </div>
    );
}