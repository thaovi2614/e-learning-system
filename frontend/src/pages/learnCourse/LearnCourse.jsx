import { useState, useEffect } from "react";
import LessonTab from "./LessonTab";
import ForumTab from "./ForumTab";
import QuestionDetail from "./QuestionDetail";
import { useNavigate, useParams, Outlet, useLocation } from "react-router-dom";
import "./learnCourse.css";

export default function LearnCourse() {
    const { id, questionId } = useParams(); 
    const [tab, setTab] = useState("lesson");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.includes("forum")) {
            setTab("forum");
        } else {
            setTab("lesson");
        }
    }, [location.pathname]);

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
                    onClick={() => { setTab("forum"); navigate(`/learn/${id}`); }}
                >
                    Diễn đàn
                </button>
            </div>

            <div className="tab-content">
                {tab === "lesson" && (
                    <div className="learn-layout">
                        <div className="learn-sidebar"><LessonTab courseId={id} /></div>
                        <div className="learn-content"><Outlet /></div>
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