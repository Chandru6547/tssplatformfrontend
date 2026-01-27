import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import "./AssignmentReportPage.css";

export default function AssignmentReportPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { assignmentId, college } = state || {};

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId || !college) {
      navigate(-1);
      return;
    }

    async function fetchReport() {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/assignment-submissions/getSubmissionByCollegeAndAssignment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ assignmentId, college })
          }
        );

        const data = await res.json();
        setReport(data || []);
      } catch (err) {
        console.error("Failed to fetch assignment report", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [assignmentId, college, navigate]);

  return (
    <div className="assignment-report-page">
      <div className="report-header">
        <h2>📊 Assignment Performance Report</h2>
        <p>College-wise student performance overview</p>
      </div>

      {loading && <div className="loading">Loading report...</div>}

      {!loading && report.length === 0 && (
        <div className="empty-state">No submissions found</div>
      )}

      {!loading && report.length > 0 && (
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Problems Solved</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, index) => (
                <tr key={r._id || index}>
                  <td className="rank">{index + 1}</td>
                  <td>{r.studentName || "N/A"}</td>
                  <td>
                    <span className="score">{r.problemsSolved}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
