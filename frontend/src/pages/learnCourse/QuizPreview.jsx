import { useNavigate } from "react-router-dom";
import { getBestScore } from "../../services/quizApi"
import { useEffect, useState } from "react";

export default function QuizPreview({ lesson }) {
  const navigate = useNavigate();
  const [bestScore, setBestScore] = useState(null)
  const isPassed = bestScore !== null && bestScore >= lesson.quiz.passScore;

  useEffect(() => {
    getBestScore(lesson.quiz.id).then(res => {
      setBestScore(res.data.best_score)
    })
  }, [lesson.quiz.id]);

  const startQuiz = () => {
    navigate(`/quiz/${lesson.quiz.id}`);
  };

  return (
    <div style={quizBox}>
      <h3>{lesson.title}</h3>

      <p>⏱ Thời gian: {lesson.quiz?.timeLimit || 0} phút</p>
      <p>🎯 Điểm đạt: {lesson.quiz?.passScore || 0}</p>

      {bestScore !== null && (
        <p>
          🏆 Điểm cao nhất: {bestScore} 
          {isPassed && " (Đã đạt)"}
        </p>
      )}

      <button 
        style={{
          ...startBtn,
          background: isPassed ? "#9ca3af" : "#2563eb",
          cursor: isPassed ? "not-allowed" : "pointer"
        }}
        onClick={startQuiz}
        disabled={isPassed}
      >
        {isPassed ? "✔️ Đã đạt" : "Bắt đầu làm bài"}
      </button>
    </div>
  );
}

const quizBox = {
  padding: 20,
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "#f8fafc"
};

const startBtn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};
