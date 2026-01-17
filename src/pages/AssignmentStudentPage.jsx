import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout, getUserId } from "../utils/auth";
import { initAssignmentTimer } from "../utils/assignmentTimer";
import "./AssignmentStudentPage.css";

export default function AssignmentStudentPage() {
  const [assignments, setAssignments] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [pageLoading, setPageLoading] = useState(true);

  const navigate = useNavigate();
  const studentId = getUserId();

  /* ---------- FETCH ASSIGNMENTS ---------- */
  const fetchAssignments = async () => {
    setPageLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/get-assignments-for-student`,
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
      const list = Array.isArray(data) ? data : [];
      setAssignments(list);

      await checkCompletedAssignments(list);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setAssignments([]);
    } finally {
      const elapsed = Date.now() - startTime;
      setTimeout(() => setPageLoading(false), Math.max(3000 - elapsed, 0));
    }
  };

  /* ---------- CHECK COMPLETED ASSIGNMENTS ---------- */
  const checkCompletedAssignments = async (assignmentList) => {
    try {
      const requests = assignmentList.map((a) =>
        fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/assignment-submissions/assignment/${a._id}/student/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          }
        )
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({
            assignmentId: a._id,
            // ✅ ONLY disable if backend says completed
            completed: data?.isCompleted === true
          }))
      );

      const results = await Promise.all(requests);

      const statusMap = {};
      results.forEach((r) => {
        statusMap[r.assignmentId] = r.completed;
      });

      setCompletedMap(statusMap);
    } catch (err) {
      console.error("Failed to check assignment completion", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  /* ---------- START ASSIGNMENT ---------- */
  const startAssignment = async (assignmentId) => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen denied", err);
    }

    // ✅ Start timer once
    initAssignmentTimer(assignmentId);

    // ✅ Navigate
    navigate(`/assignments/solve/${assignmentId}`);
  };

  /* ---------- LOADER ---------- */
  if (pageLoading) {
    return (
      <div className="course-loader">
        <p>Loading Assignments...</p>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="course-page">
      <div className="course-header">
        <div>
          <h2>Select Assignment</h2>
          <p>Choose an assignment to start solving</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>No assignments assigned yet.</p>
        </div>
      ) : (
        <div className="course-grid">
          {assignments.map((a) => {
            const isCompleted = completedMap[a._id];

            return (
              <div key={a._id} className="course-card">
                <h3>{a.name}</h3>

                <p className="mcq-meta">
                  Due: {new Date(a.dueDate).toLocaleDateString()} ·{" "}
                  {a.questions?.length || 0} Questions
                </p>

                {isCompleted && (
                  <span className="completed-badge">Completed</span>
                )}

                <button
                  className="course-btn"
                  disabled={isCompleted}
                  onClick={() => startAssignment(a._id)}
                >
                  {isCompleted ? "Completed ✓" : "Start Assignment →"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
