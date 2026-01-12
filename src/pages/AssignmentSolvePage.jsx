import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import "./AssignmentSolvePage.css";

export default function AssignmentSolvePage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);

  /* ---------- ENTER FULLSCREEN ---------- */
  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  /* ---------- EXIT FULLSCREEN ---------- */
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

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
      } catch (err) {
        console.error("Failed to load assignment", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignment();
    enterFullscreen();

    return () => exitFullscreen();
  }, [assignmentId, navigate]);

  /* ---------- PREVENT ESC / BACK ---------- */
  useEffect(() => {
    const preventExit = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", preventExit);
    return () => window.removeEventListener("beforeunload", preventExit);
  }, []);

  if (loading) {
    return <div className="assignment-loader">Loading assignment...</div>;
  }

  if (!assignment) {
    return <div className="assignment-loader">Assignment not found</div>;
  }

  return (
    <div className="assignment-solve-page" ref={containerRef}>
      {/* ---------- HEADER ---------- */}
      <div className="assignment-header">
        <div>
          <h2>{assignment.name}</h2>
          <p>{assignment.description}</p>
        </div>

        <div className="assignment-meta">
          Due: {new Date(assignment.dueDate).toLocaleDateString()}
        </div>
      </div>

      {/* ---------- QUESTION LIST ---------- */}
      <div className="assignment-body">
  <div className="questions-section">
    <h3>Questions</h3>

    <div className="question-list">
      {assignment.questions.map((q, index) => (
        <div key={q._id} className="question-card">
          <div className="question-top">
            <span className="question-index">
              Question {index + 1}
            </span>
          </div>

          <div className="question-title">{q.title}</div>

          <button
            className="solve-btn"
            onClick={() =>
                navigate(
                `/assignments/solve/${assignmentId}/question/${q._id}`
                )
            }
            >
            Solve →
            </button>
        </div>
      ))}
    </div>
  </div>
</div>
    </div>
  );
}
