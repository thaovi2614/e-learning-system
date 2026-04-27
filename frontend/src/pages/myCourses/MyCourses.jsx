import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/courseApi";
import "./myCourses.css";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getMyCourses().then(res => {
            setCourses(res.data.items);
        });
    }, []);

    return (
        <div className="my-courses-container">
            <h2 className="title">Khóa học của tôi</h2>

            {courses.length === 0 && (
                <p className="empty">Bạn chưa đăng ký khóa học nào</p>
            )}

            <div className="course-grid">
                {courses.map(c => (
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
                                <span className="badge">Đã đăng ký</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}