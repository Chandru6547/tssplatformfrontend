import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import "./MCQTestPage.css";

export default function MCQTestPage() {
  const { mcqId } = useParams();
  const navigate = useNavigate();

  const [mcq, setMcq] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const STORAGE_KEY = `mcq_${mcqId}_answers`;

  /* ---------- FETCH MCQ ---------- */
  useEffect(() => {
    const fetchMCQ = async () => {
      const res = await fetch(
        `http://localhost:3000/api/mcqs/${mcqId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setMcq(data);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers(JSON.parse(saved));
    };

    fetchMCQ();
  }, [mcqId]);

  if (!mcq) return null;

  const question = mcq.questions[index];
  const selected = answers[question._id];
  const progress = ((index + 1) / mcq.questions.length) * 100;

  /* ---------- SELECT OPTION ---------- */
  const selectOption = (opt) => {
    if (selected) return;

    const updated = { ...answers, [question._id]: opt };
    setAnswers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /* ---------- SUBMIT ---------- */
  const submitTest = async () => {
    const payload = mcq.questions.map(q => ({
      questionId: q._id,
      selectedOption: answers[q._id]
    }));

    const res = await fetch(
      "http://localhost:3000/api/mcq-submissions/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          mcqId,
          studentId: getUserId(),
          answers: payload
        })
      }
    );

    const data = await res.json();
    setScore(data.submission.score);
    setShowResult(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <div className={`exam-wrapper ${showResult ? "blur" : ""}`}>
        {/* PROGRESS BAR */}
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="exam-container">
          {/* QUESTION */}
          <div className="question-panel animate-slide">
            <span className="question-count">
              Question {index + 1} / {mcq.questions.length}
            </span>
            <h2>{question.question}</h2>
          </div>

          {/* OPTIONS */}
          <div className="options-panel">
            {["A", "B", "C", "D"].map(opt => (
              <div
                key={opt}
                className={`option-tile ${
                  selected === opt ? "selected" : ""
                }`}
                onClick={() => selectOption(opt)}
              >
                <span className="opt-circle">{opt}</span>
                <span>{question[`option${opt}`]}</span>
              </div>
            ))}

            <div className="nav-buttons">
              <button
                disabled={index === 0}
                onClick={() => setIndex(i => i - 1)}
              >
                ← Previous
              </button>

              {index < mcq.questions.length - 1 ? (
                <button
                  disabled={!selected}
                  onClick={() => setIndex(i => i + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="submit"
                  disabled={!selected}
                  onClick={submitTest}
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      {showResult && (
        <div className="modal-overlay">
          <div className="result-modal">
            <h2>🎉 Test Completed</h2>
            <p>
              Score: <strong>{score}</strong> / {mcq.questions.length}
            </p>
            <button onClick={() => navigate("/mcqs/student")}>
              Back to MCQs
            </button>
          </div>
        </div>
      )}
    </>
  );
}
