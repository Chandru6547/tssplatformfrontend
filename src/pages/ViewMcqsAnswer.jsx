import { useEffect, useState } from "react";
import { getToken, getUserId, getEmail } from "../utils/auth";
import "./ViewMcqsAnswer.css";

export default function ViewMcqsAnswer() {
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [blurred, setBlurred] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const studentId = getUserId();
  const email = getEmail();

  /* ---------- FETCH MCQS ---------- */
  useEffect(() => {
    async function fetchMcqs() {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/mcqs/getMcqsDetailForStudent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ studentId })
        }
      );
      setMcqs(await res.json());
      setLoading(false);
    }
    fetchMcqs();
  }, [studentId]);

  /* ---------- TAB SWITCH BLUR ---------- */
  useEffect(() => {
    const handler = () => setBlurred(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () =>
      document.removeEventListener("visibilitychange", handler);
  }, []);

  /* ---------- PREVENT BACKGROUND SCROLL ---------- */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  /* ---------- KEYBOARD NAVIGATION ---------- */
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "ArrowRight" && index < questions.length - 1) {
        setIndex((i) => i + 1);
        setShowExplanation(false);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
        setShowExplanation(false);
      }
      if (e.key === "Enter") setShowExplanation(true);
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, index, questions.length]);

  /* ---------- OPEN MCQ ---------- */
  const openMcq = async (mcq) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/mcq-submissions/getSubmissionForStudentAndMcq`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ studentId, mcqId: mcq._id })
      }
    );

    const submissions = await res.json();
    if (!submissions.length) return alert("Not attempted");

    const last = submissions[0];
    const hours =
      (Date.now() - new Date(last.createdAt)) / 36e5;

    if (hours < 24)
      return alert("Answers unlock after 24 hours");

    setSubmission(last);
    setQuestions(mcq.questions);
    setIndex(0);
    setShowExplanation(false);
    setOpen(true);
  };

  if (loading) return <p className="loading">Loading MCQs...</p>;

  const q = questions[index];
  const studentAnswer = submission?.answers?.[q?._id];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="mcq-page">
      <h2>MCQ Answer Review</h2>

      <p className="page-subtitle">
        Review your submitted MCQs with correct answers and explanations
      </p>

      <div className="mcq-grid">
        {mcqs.map((mcq) => (
          <div
            key={mcq._id}
            className="mcq-card-pro"
            onClick={() => openMcq(mcq)}
          >
            <div className="mcq-card-header">
              <span className="mcq-badge">MCQ</span>
              <span className="mcq-category">{mcq.category}</span>
            </div>

            <h3 className="mcq-title">{mcq.topic}</h3>

            <div className="mcq-meta">
              📝 {mcq.questions.length} Questions
            </div>

            <button className="mcq-action">
              Review Answers →
            </button>
          </div>
        ))}
      </div>

      {/* ---------- MODAL ---------- */}
      {open && (
        <div className="modal-overlay">
          <div
            className={`modal ${blurred ? "blurred" : ""}`}
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="watermark">{email}</div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="progress-text">
              Question {index + 1} of {questions.length}
            </p>

            <h3 className="question-text">{q.question}</h3>

            <ul>
              {["A", "B", "C", "D"].map((opt) => {
                const key = `option${opt}`;
                const correct = q.correctOption === opt;
                const selected = studentAnswer === opt;

                return (
                  <li
                    key={opt}
                    className={`option 
                      ${correct ? "correct pulse" : ""}
                      ${selected && !correct ? "wrong pulse" : ""}
                      ${selected ? "selected" : ""}
                    `}
                  >
                    <b>{opt}.</b> {q[key]}
                    {selected && (
                      <span className="tag your-answer">
                        Your Answer
                      </span>
                    )}
                    {correct && (
                      <span className="tag correct-tag">
                        Correct
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {!showExplanation ? (
              <button
                className="reveal"
                onClick={() => setShowExplanation(true)}
              >
                Reveal Explanation (Enter)
              </button>
            ) : (
              <div className="explanation">{q.explanation}</div>
            )}

            <div className="dots">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === index ? "active" : ""}`}
                  onClick={() => {
                    setIndex(i);
                    setShowExplanation(false);
                  }}
                />
              ))}
            </div>

            <div className="modal-actions">
              <button
                disabled={index === 0}
                onClick={() => {
                  setIndex(index - 1);
                  setShowExplanation(false);
                }}
              >
                ← Previous
              </button>

              <button
                disabled={index === questions.length - 1}
                onClick={() => {
                  setIndex(index + 1);
                  setShowExplanation(false);
                }}
              >
                Next →
              </button>

              <button className="close" onClick={() => setOpen(false)}>
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
