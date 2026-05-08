import { useState, useEffect } from "react";
import LessonTab from "./LessonTab";
import ForumTab from "./ForumTab";
import QuestionDetail from "./QuestionDetail";
import { useNavigate, useParams, Outlet, useLocation } from "react-router-dom";
import { getProgress, getProgressDetail } from "../../services/lessonProgressApi";
import "./learnCourse.css";

export default function LearnCourse() {
    const { id, questionId } = useParams();
    const [tab, setTab] = useState("lesson");
    const [progressMap, setProgressMap] = useState({});
    const [progressPercent, setProgressPercent] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.includes("forum")) {
            setTab("forum");
        } else {
            setTab("lesson");
        }
    }, [location.pathname]);

    useEffect(() => {
        getProgressDetail(id).then(res => {
            const map = {};
            res.data.forEach(p => {
                map[p.lesson_id] = p.status;
            });
            setProgressMap(map);
        });

        getProgress(id).then(res => {
            setProgressPercent(res.data.progress_percent);
        });

    }, [id]);

    return (
        <div className="learn-container">
            <button className="btn" onClick={() => navigate("/my-courses")}>← Khóa học</button>

            <div className="tabs">
                <button
                    className={tab === "lesson" ? "active" : ""}
                    onClick={() => { setTab("lesson"); navigate(`/learn/${id}`); }}
                >
                    Bài học
                </button>

                <button
                    className={tab === "forum" ? "active" : ""}
                    onClick={() => { setTab("forum"); navigate(`/learn/${id}/forum`); }}
                >
                    Diễn đàn
                </button>
            </div>

            {progressPercent >= 100 && (
                <div className="certificate-notice">
                    <span>Bạn đã hoàn thành khóa học này.</span>

                    <button onClick={() => navigate(`/certificate/${id}`)}>
                        Xem chứng nhận
                    </button>
                </div>
            )}

            <div className="tab-content">
                {tab === "lesson" && (
                    <div className="learn-layout">
                        <div className="learn-sidebar">
                            <LessonTab
                                courseId={id}
                                progressMap={progressMap}
                                progressPercent={progressPercent}
                                setProgressPercent={setProgressPercent}
                            />
                        </div>
                        <div className="learn-content"><Outlet context={{ setProgressMap, progressMap, setProgressPercent, id }} /></div>
                    </div>
                )}

                {tab === "forum" && (
                    <div className="forum-wrapper">
                        {questionId ? <QuestionDetail /> : <ForumTab courseId={id} />}
                    </div>
                )}
            </div>
        </div>
    );
}