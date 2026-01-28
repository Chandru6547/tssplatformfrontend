import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import "./MCQStudentPage.css";

export default function MCQStudentPage() {
  const [mcqs, setMcqs] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);

  const navigate = useNavigate();
  const studentId = getUserId();

  /* ---------- CHECK COMPLETED MCQS ---------- */
  const checkCompletedMCQs = useCallback(
    async (mcqList) => {
      try {
        const requests = mcqList.map((mcq) =>
          fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/mcq-submissions/student/${studentId}/mcq/${mcq._id}`,
            {
              headers: {
                Authorization: `Bearer ${getToken()}`
              }
            }
          )
            .then((res) => res.json())
            .then((data) => ({
              mcqId: mcq._id,
              completed: Array.isArray(data) && data.length > 0
            }))
        );

        const results = await Promise.all(requests);
        const statusMap = {};

        results.forEach((r) => {
          statusMap[r.mcqId] = r.completed;
        });

        setCompletedMap(statusMap);
      } catch (err) {
        console.error("Failed to check MCQ completion", err);
      }
    },
    [studentId]
  );

  /* ---------- FETCH MCQS ---------- */
  const fetchMCQs = useCallback(async () => {
    setPageLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/mcqs/mcqs-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ studentId })
        }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      const mcqList = Array.isArray(data) ? data : [];
      setMcqs(mcqList);

      await checkCompletedMCQs(mcqList);
    } catch (err) {
      console.error("Failed to load MCQs", err);
      setMcqs([]);
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setPageLoading(false), Math.max(3000 - elapsed, 0));
    }
  }, [studentId, navigate, checkCompletedMCQs]);

  useEffect(() => {
    fetchMCQs();
  }, [fetchMCQs]);

  /* ---------- LOADER ---------- */
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
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </p>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="course-page">
      <div className="course-header">
        <div>
          <h2>Select MCQ Test</h2>
          <p>Choose a topic to start the MCQ assessment</p>
        </div>
      </div>

      {mcqs.length === 0 ? (
        <div className="empty-state">
          <p>No MCQ tests assigned yet.</p>
        </div>
      ) : (
        <div className="course-grid">
          {mcqs.map((mcq) => {
            const isCompleted = completedMap[mcq._id];

            return (
              <div key={mcq._id} className="course-card">
                <h3>{mcq.topic}</h3>

                <p className="mcq-meta">
                  {mcq.category} · {mcq.questions?.length || 0} Questions
                </p>

                {isCompleted && (
                  <span className="completed-badge">Completed</span>
                )}

                <button
                  className="course-btn"
                  disabled={isCompleted}
                  onClick={() => navigate(`/mcqs/test/${mcq._id}`)}
                >
                  {isCompleted ? "Completed ✓" : "Start Test →"}
                </button>
              </div>
            );
          })}

          {/* ---------- GHOST CARDS TO MAINTAIN 3 PER ROW ---------- */}
          {Array.from({
            length: (3 - (mcqs.length % 3)) % 3
          }).map((_, index) => (
            <div key={`ghost-${index}`} className="course-card ghost-card" />
          ))}
        </div>
      )}
    </div>
  );
}
