import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import QuizPreview from "./QuizPreview"
import { getLessonById } from "../../services/lessonApi";
import { getProgress, startLesson, completeLesson } from "../../services/lessonProgressApi";


export default function LessonViewer() {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const { setProgressMap, progressMap, setProgressPercent, id } = useOutletContext();
    const [loading, setLoading] = useState(false);
    const isDone = progressMap[lessonId] === "COMPLETED";
    

    useEffect(() => {
        async function fetchData() {
            const res = await getLessonById(lessonId);
            const data = res.data;
            setLesson(data);

            setProgressMap(prev => {
                if (prev[lessonId] === "COMPLETED") return prev;

                return {
                    ...prev,
                    [lessonId]: "IN_PROGRESS"
                };
            });

            if (progressMap[lessonId] !== "COMPLETED") {
                startLesson(lessonId);
            }        
        }

        fetchData();
    }, [lessonId]);

    const handleComplete = async () => {
        let oldStatus;

        setProgressMap(prev => {
            if (prev[lessonId] === "COMPLETED") return prev;

            oldStatus = prev[lessonId];

            return {
                ...prev,
                [lessonId]: "COMPLETED"
            }
        })

        try {
            await completeLesson(lessonId);

            const res = await getProgress(id);
            setProgressPercent(res.data.progress_percent);
        } catch (err) {
            setProgressMap(prev => ({
                ...prev,
                [lessonId]: oldStatus
            }));

            console.error("API lỗi:", err);
        }
    }

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
                <>
                    <iframe
                        src={lesson.slideFile}
                        width="100%"
                        height="500px"
                        title="Slide"
                        allow="autoplay"
                    />
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                        <button
                            className={`complete-btn ${isDone ? "done" : ""}`}
                            onClick={handleComplete}
                            disabled={isDone || loading}
                        >
                            {loading
                                ? "Đang xử lý..."
                                : isDone
                                ? "✔️ Đã hoàn thành"
                                : "Hoàn thành bài học"}
                        </button>
                    </div>
                </>
            )}

            {/* VIDEO */}
            {lesson.type === "VIDEO" && lesson.videoUrl && (
                <video
                    controls
                    width="100%"
                    preload="metadata"
                    onEnded={handleComplete}
                >
                    <source src={lesson.videoUrl} type="video/mp4" />
                </video>
            )}

            {/* QUIZ */}
            {lesson.type === "QUIZ" && (
                <QuizPreview lesson={lesson} />
            )}
        </div>
    );
}