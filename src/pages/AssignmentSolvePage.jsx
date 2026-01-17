import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import AssignmentTimer from "./AssignmentTimer";
import { clearAssignmentTimer } from "../utils/assignmentTimer";
import "./AssignmentSolvePage.css";

export default function AssignmentSolvePage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(true);

  /* ---------- ENTER FULLSCREEN ---------- */
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request blocked", err);
    }
  };

  /* ---------- FULLSCREEN ENFORCEMENT ---------- */
  useEffect(() => {
    enterFullscreen();

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  /* ---------- FETCH ASSIGNMENT ---------- */
  useEffect(() => {
    async function fetchAssignment() {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/assignments/${assignmentId}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          }
        );

        if (res.status === 401 || res.status === 403) {
          logout();
          navigate("/login");
          return;
        }

        const data = await res.json();
        setAssignment(data);

        const key = `assignment_completed_questions_${assignmentId}`;
        setCompletedQuestions(JSON.parse(localStorage.getItem(key)) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignment();
  }, [assignmentId, navigate]);

  /* ---------- SUBMIT ASSIGNMENT ---------- */
  const submitAssignment = async () => {
    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/assignment-submissions/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            assignmentId,
            studentId: getUserId(),
            solvedQuestions: completedQuestions,
            isFinalSubmisison: true
          })
        }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error("Submit failed");

      clearAssignmentTimer(assignmentId);
      // localStorage.removeItem(
      //   `assignment_completed_questions_${assignmentId}`
      // );

      setSubmitted(true);

      setTimeout(() => {
        navigate("/assignment-student");
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- FULLSCREEN + NAVIGATE (Solve Button) ---------- */
  const goFullscreenAndNavigate = async (path) => {
    await enterFullscreen();
    navigate(path);
  };

  if (loading) {
    return <div className="assignment-loader">Loading assignment...</div>;
  }

  return (
    <div className="assignment-solve-page" ref={containerRef}>
      {/* ---------- FULLSCREEN BLOCKER ---------- */}
      {!isFullscreen && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-card">
            <h2>Fullscreen Required</h2>
            <p>Please switch back to fullscreen to continue the test.</p>
            <button onClick={enterFullscreen}>Go Fullscreen</button>
          </div>
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <div className="assignment-header">
        <div>
          <h2>{assignment.name}</h2>
          <p>{assignment.description}</p>
        </div>

        <div className="assignment-header-right">
          <AssignmentTimer
            assignmentId={assignmentId}
            onTimeUp={() => setShowModal(true)}
          />

          <span className="assignment-meta">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>

          <button className="end-test-btn" onClick={() => setShowModal(true)}>
            End Test
          </button>
        </div>
      </div>

      {/* ---------- BODY ---------- */}
      <div className="assignment-body">
        <div className="questions-section">
          <h3>Questions</h3>

          <div className="question-list">
            {assignment.questions.map((q, index) => {
              const completed = completedQuestions.includes(q._id);

              return (
                <div
                  key={q._id}
                  className={`question-card ${
                    completed ? "completed" : ""
                  }`}
                >
                  <span className="question-index">
                    Question {index + 1}
                  </span>

                  <div className="question-title">{q.title}</div>

                  <button
                    className="solve-btn"
                    disabled={completed}
                    onClick={() =>
                      goFullscreenAndNavigate(
                        `/assignments/solve/${assignmentId}/question/${q._id}`
                      )
                    }
                  >
                    {completed ? "Completed ✓" : "Solve →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- SUBMIT MODAL ---------- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            {!submitted ? (
              <>
                <h3>Submit Assignment?</h3>
                <p>
                  Completed <b>{completedQuestions.length}</b> /{" "}
                  <b>{assignment.questions.length}</b> questions.
                </p>

                <div className="modal-actions">
                  <button
                    className="modal-btn secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn primary"
                    onClick={submitAssignment}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Assignment Submitted ✅</h3>
                <p>Redirecting...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
