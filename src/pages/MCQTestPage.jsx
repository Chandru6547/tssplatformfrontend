import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import "./MCQTestPage.css";

export default function MCQTestPage() {
  const { mcqId } = useParams();
  const navigate = useNavigate();

  const [mcq, setMcq] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const STORAGE_KEY = `mcq_${mcqId}_answers`;

  /* ---------- FULLSCREEN (SAFE) ---------- */
  const enterFullscreen = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
  };

  const exitFullscreenSafely = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  /* ---------- CAMERA + MIC ---------- */
  const startCameraMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Detect camera / mic stop
      stream.getTracks().forEach(track => {
        track.onended = () => {
          submitTest(true);
        };
      });
    } catch (err) {
      alert("Camera & Microphone permission is required");
      throw err;
    }
  };

  const stopCameraMic = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  /* ---------- FETCH MCQ ---------- */
  useEffect(() => {
    const fetchMCQ = async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/mcqs/${mcqId}`,
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

  /* ---------- FULLSCREEN EXIT ---------- */
  useEffect(() => {
    const handleExit = () => {
      if (!document.fullscreenElement && started && !showResult) {
        submitTest(true);
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    return () =>
      document.removeEventListener("fullscreenchange", handleExit);
  }, [started, showResult]);

  /* ---------- START TEST ---------- */
  const startTest = async () => {
    try {
      await enterFullscreen();
      await startCameraMic();
      setStarted(true);
    } catch {
      exitFullscreenSafely();
    }
  };

  if (!mcq) return null;

  /* ---------- START SCREEN ---------- */
  if (!started) {
    return (
      <div className="start-screen">
        <h1>{mcq.title || "MCQ Test"}</h1>
        <ul className="rules">
          <li>Fullscreen is mandatory</li>
          <li>Camera & microphone must stay ON</li>
          <li>Violation will auto-submit the test</li>
        </ul>
        <button className="start-btn" onClick={startTest}>
          Start Test
        </button>
      </div>
    );
  }

  const question = mcq.questions[index];
  const selected = answers[question._id];
  const progress = ((index + 1) / mcq.questions.length) * 100;

  /* ---------- SELECT OPTION ---------- */
  const selectOption = opt => {
    if (selected) return;
    const updated = { ...answers, [question._id]: opt };
    setAnswers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /* ---------- SUBMIT TEST ---------- */
  const submitTest = async (forced = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = mcq.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] || null
      }));

      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/mcq-submissions/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            mcqId,
            studentId: getUserId(),
            answers: payload,
            forcedSubmit: forced
          })
        }
      );

      const data = await res.json();
      setScore(data?.submission?.score ?? data?.score ?? 0);
      setShowResult(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setScore(0);
      setShowResult(true);
    } finally {
      stopCameraMic();
      exitFullscreenSafely();
    }
  };

  return (
    <>
      {/* Hidden camera preview */}
      <video ref={videoRef} className="camera-preview" muted />

      <div className={`exam-wrapper ${showResult ? "blur" : ""}`}>
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="exam-container">
          <div className="question-panel">
            <h2>{question.question}</h2>
          </div>

          <div className="options-panel">
            {["A", "B", "C", "D"].map(opt => (
              <div
                key={opt}
                className={`option-tile ${selected === opt ? "selected" : ""}`}
                onClick={() => selectOption(opt)}
              >
                <span className="opt-circle">{opt}</span>
                <span>{question[`option${opt}`]}</span>
              </div>
            ))}

            <div className="nav-buttons">
              {index < mcq.questions.length - 1 ? (
                <button disabled={!selected} onClick={() => setIndex(i => i + 1)}>
                  Next →
                </button>
              ) : (
                <button
                  className="submit"
                  disabled={!selected || submitting}
                  onClick={() => submitTest(false)}
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResult && (
        <div className="modal-overlay">
          <div className="result-modal">
            <h2>Test Completed</h2>
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
