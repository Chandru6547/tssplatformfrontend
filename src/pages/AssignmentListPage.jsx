import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import "./AssignmentListPage.css";

export default function AssignmentListPage() {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH ASSIGNMENTS ---------------- */
  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/assignments`,
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
        setAssignments(data);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [navigate]);

  if (loading) {
    return <div className="page-loader">Loading assignments...</div>;
  }

  return (
    <div className="assignment-list-page">
      <div className="page-header">
        <h2>Assignments</h2>
        <button
          className="primary-btn"
          onClick={() => navigate("/assignments/create")}
        >
          + Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">No assignments found</div>
      ) : (
        <div className="assignment-table">
          <div className="table-header">
            <span>Name</span>
            <span>Due Date</span>
            <span>Questions</span>
            <span>Actions</span>
          </div>

          {assignments.map((a) => (
            <div key={a._id} className="table-row">
              <span className="name">{a.name}</span>
              <span>
                {new Date(a.dueDate).toLocaleDateString()}
              </span>
              <span>{a.questions?.length || 0}</span>
              <span className="actions">
                <button
                  onClick={() =>
                    navigate(`/assignments/${a._id}`)
                  }
                >
                  View
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
