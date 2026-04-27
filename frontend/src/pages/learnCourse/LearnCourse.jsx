import { useParams } from "react-router-dom";
import { useState } from "react";
import LessonTab from "./LessonTab";
import ForumTab from "./ForumTab";
import "./learnCourse.css";

export default function LearnCourse() {
    const { id } = useParams();
    const [tab, setTab] = useState("lesson");

    return (
        <div className="learn-container">
            <h2>Học khóa học</h2>

            {/* TAB */}
            <div className="tabs">
                <button 
                    className={tab === "lesson" ? "active" : ""}
                    onClick={() => setTab("lesson")}
                >
                    Bài học
                </button>

                <button 
                    className={tab === "forum" ? "active" : ""}
                    onClick={() => setTab("forum")}
                >
                    Diễn đàn
                </button>
            </div>

            {/* CONTENT */}
            <div className="tab-content">
                {tab === "lesson" && <LessonTab courseId={id} />}
                {tab === "forum" && <ForumTab courseId={id} />}
            </div>
        </div>
    );
}