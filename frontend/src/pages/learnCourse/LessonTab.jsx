import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById } from "../../services/courseApi";

export default function LessonTab({ courseId, progressMap, progressPercent, setProgressPercent }) {
    const [course, setCourse] = useState(null);
    const [openChapter, setOpenChapter] = useState(null);
    const navigate = useNavigate();
    const { lessonId } = useParams();

    useEffect(() => {
        getCourseById(courseId).then(res => {
            setCourse(res.data);
        });
    }, [courseId]);

    useEffect(() => {
        if (course && lessonId) {
            course.chapters.forEach(ch => {
                if (ch.lessons.some(l => l.id == lessonId)) {
                    setOpenChapter(ch.id);
                }
            });
        }
    }, [course, lessonId]);

    const toggleChapter = (id) => {
        setOpenChapter(prev => (prev === id ? null : id));
    };

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

    function getProgressIcon(lessonId) {
        const status = progressMap[lessonId];

        if (status === "COMPLETED") return "✔️";
        if (status === "IN_PROGRESS") return "⏳";
        return "⭕";
    }

    if (!course) return <p>Đang tải...</p>;

    return (
        <div className="chapter-list">
            <div 
                className="progress mb-3"
                role="progressbar"
                aria-label="Animated striped example"
                aria-valuenow={progressPercent}
                aria-valuemin="0"
                aria-valuemax="100"
            >
                <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    style={{width: `${progressPercent}%`}}
                >
                    {progressPercent}
                </div>
            </div>
            <h3>{course.name}</h3>

            {course.chapters?.map(chapter => (
                <div key={chapter.id} className="chapter-item">

                    <div
                        className="chapter-header"
                        onClick={() => toggleChapter(chapter.id)}
                    >
                        <span>{chapter.title}</span>
                        <span>
                            {openChapter === chapter.id ? "▲" : "▼"}
                        </span>
                    </div>

                    {openChapter === chapter.id && (
                        <div className="lesson-list">
                            {chapter.lessons?.map(lesson => (
                                <div
                                    key={lesson.id}
                                    className={`lesson-item ${
                                        lesson.id == lessonId ? "active" : ""
                                    }`}
                                    onClick={() =>
                                        navigate(`/learn/${courseId}/lesson/${lesson.id}`)
                                    }
                                >
                                    <span className="lesson-icon">
                                        {getLessonIcon(lesson.type)}
                                    </span>

                                    <span>{lesson.title}</span>

                                    <span style={{ marginLeft: "auto" }}>
                                        {getProgressIcon(lesson.id)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}