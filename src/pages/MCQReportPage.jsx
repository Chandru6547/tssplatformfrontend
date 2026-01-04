import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MCQReportPage.css";

export default function MCQReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { college, year, batch } = location.state || {};

  const [mcqs, setMcqs] = useState([]);
  const [report, setReport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------
     FETCH ALL MCQs (FOR DROPDOWN)
  --------------------------------------------- */
  useEffect(() => {
    if (!college || !year || !batch) {
      navigate("/campuses");
      return;
    }

    const fetchAllMCQs = async () => {
      try {
        const res = await fetch(
          "https://tssplatform.onrender.com/api/mcqs/getallmcq",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ college, year, batch })
          }
        );

        if (!res.ok) throw new Error("Failed to fetch MCQs");

        setMcqs(await res.json());
      } catch (err) {
        console.error(err);
        setError("Unable to load MCQs");
      } finally {
        setLoading(false);
      }
    };

    fetchAllMCQs();
  }, [college, year, batch, navigate]);

  /* ---------------------------------------------
     DROPDOWN OPTIONS
  --------------------------------------------- */
  const dropdownOptions = useMemo(() => {
    return mcqs.map(mcq => ({
      label: `${mcq.category} - ${mcq.topic}`,
      value: mcq._id
    }));
  }, [mcqs]);

  /* ---------------------------------------------
     FETCH REPORT BY BATCH + MCQ
  --------------------------------------------- */
  const handleSelectMCQ = async (mcqId) => {
    if (!mcqId) return;

    try {
      setLoading(true);
      setReport([]);

      const res = await fetch(
        "https://tssplatform.onrender.com/api/mcq-submissions/getreporbytbatch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college,
            year,
            batch,
            mcqId
          })
        }
      );

      if (!res.ok) throw new Error("Failed to fetch report");

      setReport(await res.json());
    } catch (err) {
      console.error(err);
      setError("Unable to load MCQ report");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------
     UI STATES
  --------------------------------------------- */
  if (error) return <p className="status error">{error}</p>;

  return (
    <div className="mcq-report-page">
      {/* HEADER */}
      <div className="mcq-header">
        <div>
          <h2>MCQ Report</h2>
          <p>
            {college} · Year {year} · Batch {batch}
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* DROPDOWN */}
      <div className="filter-bar">
        <select defaultValue="" onChange={e => handleSelectMCQ(e.target.value)}>
          <option value="" disabled>
            Select Category - Topic
          </option>
          {dropdownOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="status">Loading report…</p>}

      {/* REPORT TABLE */}
      {report.length > 0 && (
        <div className="mcq-card">
          <h4>Topic: {report[0].mcqTopic}</h4>

          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Score</th>
                <th>Total</th>
                <th>Attempted</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.student?.name || "Unknown"}</td>
                  <td>{r.student?.email || "-"}</td>
                  <td>{r.score}</td>
                  <td>{r.totalMarks}</td>
                  <td>{r.studentAttemptedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.length === 0 && !loading && (
        <p className="status">No submissions found</p>
      )}
    </div>
  );
}
