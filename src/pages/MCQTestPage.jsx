import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import "./MCQTestPage.css";

/* ================= SHUFFLE UTILITY (ADDED) ================= */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function MCQTestPage() {
  const { mcqId } = useParams();
  const navigate = useNavigate();
  const userId = getUserId(); // ✅ already used elsewhere

  const [mcq, setMcq] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  /* CAMERA */
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraStartedRef = useRef(false);

  /* TAB SWITCH */
  const tabSwitchCountRef = useRef(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  /* ================= STORAGE KEYS (UPDATED) ================= */
  const STORAGE_KEY = useRef(`mcq_${mcqId}_${userId}_answers`).current;
  const ORDER_KEY = useRef(`mcq_${mcqId}_${userId}_order`).current;

  /* ---------- FULLSCREEN ---------- */
  const enterFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreenSafely = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  /* ---------- CAMERA + MIC ---------- */
  const startCameraMic = async () => {
    if (cameraStartedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: true
      });

      streamRef.current = stream;
      cameraStartedRef.current = true;

      const video = videoRef.current;
      if (!video) return;

      video.pause();
      video.srcObject = null;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      video.style.display = "none";
      video.style.display = "block";

      await new Promise(resolve => {
        video.onloadedmetadata = () => resolve();
      });

      await video.play();

      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (!showResult) submitTest(true);
        };
      });
    } catch (err) {
      alert("Camera & microphone permission is mandatory");
      throw err;
    }
  };

  const stopCameraMic = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cameraStartedRef.current = false;
  };

  /* ---------- SUBMIT TEST ---------- */
  const submitTest = useCallback(async (forced = false) => {
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
            studentId: userId,
            answers: payload,
            forcedSubmit: forced
          })
        }
      );

      const data = await res.json();
      setScore(data?.submission?.score ?? data?.score ?? 0);
      setShowResult(true);

      /* ---------- CLEANUP (ADDED) ---------- */
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ORDER_KEY);
    } finally {
      stopCameraMic();
      exitFullscreenSafely();
    }
  }, [mcqId, userId, answers, mcq, submitting, STORAGE_KEY, ORDER_KEY]);

  /* ================= FETCH MCQ + SHUFFLE (UPDATED) ================= */
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

      /* ---------- SHUFFLE QUESTIONS PER USER ---------- */
      const savedOrder = localStorage.getItem(ORDER_KEY);
      let finalQuestions;

      if (savedOrder) {
        const order = JSON.parse(savedOrder);
        finalQuestions = order
          .map(id => data.questions.find(q => q._id === id))
          .filter(Boolean);
      } else {
        finalQuestions = shuffleArray(data.questions);
        localStorage.setItem(
          ORDER_KEY,
          JSON.stringify(finalQuestions.map(q => q._id))
        );
      }

      setMcq({ ...data, questions: finalQuestions });

      /* ---------- RESTORE ANSWERS ---------- */
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers(JSON.parse(saved));
    };

    fetchMCQ();
  }, [mcqId, navigate]);

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
  }, [started, showResult, submitTest]);

  /* ---------- TAB SWITCH DETECTION ---------- */
  useEffect(() => {
    if (!started || showResult) return;

    const handleViolation = () => {
      tabSwitchCountRef.current += 1;

      if (tabSwitchCountRef.current === 2) {
        setShowTabWarning(true);
      }

      if (tabSwitchCountRef.current >= 3) {
        submitTest(true);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const onBlur = () => handleViolation();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [started, showResult, submitTest]);

  /* ---------- START TEST ---------- */
  const startTest = async () => {
    try {
      await startCameraMic();
      await enterFullscreen();
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
          <li>Fullscreen mandatory</li>
          <li>Camera & microphone ON</li>
          <li>Tab switching monitored</li>
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



  return (
    <>
      <video
        ref={videoRef}
        className="camera-preview"
        muted
        autoPlay
        playsInline
      />

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

      {showTabWarning && (
        <div className="modal-overlay">
          <div className="result-modal">
            <h2>Warning ⚠️</h2>
            <p>Do not switch tabs again.</p>
            <button onClick={() => setShowTabWarning(false)}>
              Continue Test
            </button>
          </div>
        </div>
      )}

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
  