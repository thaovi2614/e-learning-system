import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLessonById } from "../../services/lessonApi";

export default function LessonViewer() {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const res = await getLessonById(lessonId);
            const data = res.data;
            setLesson(data);
        }

        fetchData();
    }, [lessonId]);

    function extractFileId(url) {
        const match = url.match(/\/d\/(.*?)\//);
        return match ? match[1] : null;
    }

    if (!lesson) return <div className="loading">Đang tải bài học...</div>;

    return (
        <div className="lesson-viewer">
            <h2>{lesson.title}</h2>

            {/* SLIDE */}
            {lesson.type === "SLIDE" && (
                <iframe
                    src={lesson.slideFile}
                    width="100%"
                    height="500px"
                    title="Slide"
                    allow="autoplay"
                />
            )}

            {/* VIDEO */}
            {lesson.type === "VIDEO" && lesson.videoUrl && (
                <video
                    controls
                    width="100%"
                    preload="metadata" // 👈 chỉ load metadata trước
                >
                    <source src={lesson.videoUrl} type="video/mp4" />
                </video>
            )}

            {/* QUIZ */}
            {lesson.type === "QUIZ" && (
                <div>Quiz sẽ làm sau</div>
            )}
        </div>
    );
}