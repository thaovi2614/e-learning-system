import { useEffect, useState, useCallback } from "react";
import "./RecommendedCourses.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const CAREER_GOALS = [
  { value: "backend", label: "Backend Developer" },
  { value: "frontend", label: "Frontend Developer" },
  { value: "data_analyst", label: "Data Analyst" },
  { value: "ai", label: "AI Engineer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "marketing", label: "Digital Marketing" },
  { value: "business", label: "Business / Startup" },
  { value: "hr", label: "Human Resources" },
  { value: "language", label: "Language Learning" },
  { value: "soft_skill", label: "Soft Skills" },
];

export default function RecommendedCourses() {
  const navigate = useNavigate();
  const [careerCourses, setCareerCourses] = useState([]);
  const [historyCourses, setHistoryCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("career");
  const [goal, setGoal] = useState("backend");

  const [currentLevel, setCurrentLevel] = useState("");


  const fetchData = useCallback(async (currentGoal) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/courses/recommend?goal=${currentGoal}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ gửi cookie tự động
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setCareerCourses(data.career_recommendations || []);
      setHistoryCourses(data.history_recommendations || []);

      setCurrentLevel(data.current_level || "");



    } catch (e) {
      console.error("Fetch error:", e);
      setCareerCourses([]);
      setHistoryCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData(goal);
  }, [goal, fetchData]);

  const displayed = tab === "career" ? careerCourses : historyCourses;

  return (
    <div className="recommend-page">
      <div className="recommend-hero">

        <h1>Gợi ý khóa học dành cho bạn</h1>
        <div className="recommend-user-level">


          <span>
            🚀 Level hiện tại:
            <strong> {currentLevel || "beginner"}</strong>
          </span>
        </div>

      </div>

      <div className="recommend-filter">
        <div className="recommend-tabs">
          <button
            className={tab === "career" ? "active" : ""}
            onClick={() => setTab("career")}
          >
            Theo mục tiêu nghề nghiệp
          </button>

          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            Theo lịch sử học
          </button>
        </div>

        {tab === "career" && (
          <div className="goal-select">
            <label>Chọn mục tiêu nghề nghiệp</label>

            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              {CAREER_GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="recommend-content">
        <div className="recommend-section-header">
          <h2>
            {tab === "career"
              ? "Gợi ý theo mục tiêu nghề nghiệp"
              : "Gợi ý từ lịch sử học"}
          </h2>

          <p>
            {tab === "career"
              ? "Các khóa học phù hợp với định hướng nghề nghiệp hiện tại."
              : "Các khóa học liên quan đến nội dung bạn đã học trước đó."}
          </p>
        </div>

        {loading && (
          <p className="recommend-loading">Đang tải gợi ý phù hợp...</p>
        )}

        {!loading && displayed.length === 0 && (
          <div className="recommend-empty">
            <h2>Chưa có gợi ý phù hợp</h2>
            <p>
              Hãy chọn mục tiêu nghề nghiệp hoặc đăng ký khóa học để hệ thống đề xuất tốt hơn.
            </p>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="recommend-grid">
            {displayed.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                type={tab}
                onView={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, type, onView }) {
  return (
    <div className="rec-card">
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.name} className="rec-img" />
      ) : (
        <div className="rec-img-placeholder" />
      )}

      <div className="rec-body">
        <div className="rec-top">
          <span className={`rec-type-badge ${type}`}>
            {type === "career" ? "Theo mục tiêu" : "Theo lịch sử học"}
          </span>

          <span className="rec-score">Score: {course.score ?? 0}</span>
        </div>

        <h3>{course.name}</h3>
        <p className="rec-subtitle">{course.subtitle}</p>

        {course.ai_reason && (
          <p className="rec-ai-reason">✨ {course.ai_reason}</p>
        )}

        <div className="rec-footer">
          <strong>{Number(course.price || 0).toLocaleString("vi-VN")} đ</strong>
          <button onClick={onView}>Xem khóa học</button>
        </div>
      </div>
    </div>
  );
}