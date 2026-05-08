import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/courseApi";
import { getProgress } from "../../services/lessonProgressApi";
import "./myCourses.css";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        getMyCourses().then(async (res) => {
            const items = res.data.items;
            setCourses(items);

            const entries = await Promise.all(
                items.map(async (c) => {
                    try {
                        const r = await getProgress(c.id);
                        return [c.id, r.data.progress_percent];
                    } catch {
                        return [c.id, 0];
                    }
                })
            );

            setProgressMap(Object.fromEntries(entries));
        });
    }, []);

    return (
        <div className="my-courses-container">
            <h2 className="title">Khóa học của tôi</h2>

            {courses.length === 0 && (
                <p className="empty">Bạn chưa đăng ký khóa học nào</p>
            )}

            <div className="course-grid">
                {courses.map(c => {
                    const percent = progressMap[c.id] ?? null;
                    const isDone = percent === 100;

                    return (
                        <div
                            key={c.id}
                            className="course-card"
                            onClick={() => navigate(`/learn/${c.id}`)}
                        >
                            <div className="thumbnail">
                                <img src={c.thumbnail} alt="" />
                                <div className="overlay">
                                    <span>Xem khóa học</span>
                                </div>
                            </div>

                            <div className="card-body">
                                <h3>{c.name}</h3>
                                <p>{c.subtitle}</p>

                                <div className="card-footer">
                                    <span className={`badge ${isDone ? "done" : "in-progress"}`}>
                                        {isDone ? "✅ Đã hoàn thành" : "⏳ Đang tiến hành"}
                                    </span>
                                    {percent !== null && (
                                        <span className="percent">{percent}%</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}