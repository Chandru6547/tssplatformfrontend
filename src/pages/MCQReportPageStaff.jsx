import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import "./MCQReportPageStaff.css";

export default function MCQReportPageStaff() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { mcqId, college } = state || {};

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mcqId || !college) {
      navigate(-1);
      return;
    }

    async function fetchReport() {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/mcq-submissions/getSubmissionByCollegeAndMcq`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ mcqId, college })
          }
        );

        const data = await res.json();
        setReport(data || []);
      } catch (err) {
        console.error("Failed to fetch MCQ report", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [mcqId, college, navigate]);

  return (
    <div className="mcq-report-page">
      <div className="report-header">
        <h2>📊 MCQ Performance Report</h2>
        <p>College-wise MCQ test performance</p>
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
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, index) => (
                <tr key={r._id || index}>
                  <td className="rank">{index + 1}</td>
                  <td>{r.studentId?.name || "N/A"}</td>
                  <td>
                    <span className="score">{r.score}</span>
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
