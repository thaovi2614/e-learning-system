import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuizById, submitQuiz } from "../../services/quizApi";

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function fetchQuiz() {
      const res = await getQuizById(quizId);
      const data = res.data;

      setQuiz(data);
      setTimeLeft(data.timeLimit * 60);
    }

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async () => {
    try {
      await submitQuiz(quizId, answers);

      alert("Nộp bài thành công!");

      navigate(`/learn/${quiz.course_id}`);
    } catch (err) {
      console.error(err);
      alert("Nộp bài thất bại!");
    }
  };

  if (!quiz) return <div>Đang tải quiz...</div>;

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>📝 Bài kiểm tra</h2>

      {/* TIMER */}
      <div style={timerStyle}>
        ⏱ {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      {/* QUESTIONS */}
      {quiz.quizQuestions.map((q, index) => (
        <div key={q.id} style={questionBox}>
          <p style={questionText}>
            <b>Câu {index + 1}:</b> {q.question_text}
          </p>

          {["A", "B", "C", "D"].map(opt => (
            <label key={opt} style={optionStyle}>
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={answers[q.id] === opt}
                onChange={() => handleSelect(q.id, opt)}
              />
              <span style={{ marginLeft: 8 }}>
                {q[`option${opt}`]}
              </span>
            </label>
          ))}
        </div>
      ))}

      {/* SUBMIT BUTTON */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button style={submitBtn} onClick={handleSubmit}>
          Nộp bài
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px"
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "20px"
};

const timerStyle = {
  fontSize: 20,
  fontWeight: "bold",
  color: "red",
  marginBottom: 20,
  textAlign: "right"
};

const questionBox = {
  marginBottom: 20,
  padding: 16,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fafafa"
};

const questionText = {
  marginBottom: 10
};

const optionStyle = {
  display: "block",
  padding: "6px 0",
  cursor: "pointer"
};

const submitBtn = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#1976d2",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "0.2s"
};