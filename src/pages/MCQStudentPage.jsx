import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import "./MCQStudentPage.css";

export default function MCQStudentPage() {
  const [mcqs, setMcqs] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const navigate = useNavigate();

  /* ---------- FETCH MCQS (MIN 3s LOADER) ---------- */
  const fetchMCQs = async () => {
    setPageLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch(
        "http://localhost:3000/api/mcqs/mcqs-student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            studentId: getUserId()
          })
        }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setMcqs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load MCQs", err);
      setMcqs([]);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(3000 - elapsed, 0);
      setTimeout(() => setPageLoading(false), remaining);
    }
  };

  useEffect(() => {
    fetchMCQs();
  }, []);

  /* ---------- HUMAN LOADER ---------- */
  if (pageLoading) {
    return (
      <div className="course-loader">
        <div className="human-loader">
          <div className="head"></div>
          <div className="body"></div>

          <div className="arm left-arm"></div>
          <div className="arm right-arm"></div>

          <div className="leg left-leg"></div>
          <div className="leg right-leg"></div>
        </div>

        <p className="loader-text">
          Loading MCQs
          <span className="dots">
            <i>.</i><i>.</i><i>.</i>
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="course-page">
      <div className="course-header">
        <div>
          <h2>Select MCQ Test</h2>
          <p>Choose a topic to start the MCQ assessment</p>
        </div>
      </div>

      {/* ---------- EMPTY STATE ---------- */}
      {mcqs.length === 0 ? (
        <div className="empty-state">
          <p>No MCQ tests assigned yet.</p>
        </div>
      ) : (
        <div className="course-grid">
          {mcqs.map(mcq => (
            <div key={mcq._id} className="course-card">
              <h3>{mcq.topic}</h3>

              <p className="mcq-meta">
                {mcq.category} · {mcq.questions?.length || 0} Questions
              </p>

              <button
                className="course-btn"
                onClick={() =>
                  navigate(`/mcqs/test/${mcq._id}`)
                }
              >
                Start Test →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
