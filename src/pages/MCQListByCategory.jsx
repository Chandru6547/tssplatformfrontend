import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import "./MCQLibrary.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

export default function MCQListByCategory() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- ASSIGN MODAL STATE ---------- */
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMcq, setSelectedMcq] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [years, setYears] = useState([]);
  const [batches, setBatches] = useState([]);
  const [campus, setCampus] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState("");

  useEffect(() => {
    fetchMCQs();
  }, [category]);

  /* ---------- FETCH CAMPUSES ---------- */
  useEffect(() => {
    fetch(`${API_BASE}/campus/get`)
      .then(res => res.json())
      .then(setCampuses)
      .catch(() => setCampuses([]));
  }, []);

  /* ---------- FETCH YEARS ---------- */
  useEffect(() => {
    if (!campus) return;

    fetch(`${API_BASE}/year/get-by-campus?campus=${encodeURIComponent(campus)}`)
      .then(res => res.json())
      .then(data => {
        setYears(data);
        setBatches([]);
        setYear("");
        setBatch("");
      });
  }, [campus]);

  /* ---------- FETCH BATCHES ---------- */
  useEffect(() => {
    if (!campus || !year) return;

    fetch(
      `${API_BASE}/batch/get-by-campus-year?campus=${encodeURIComponent(
        campus
      )}&year=${year}`
    )
      .then(res => res.json())
      .then(data => {
        setBatches(data);
        setBatch("");
      });
  }, [campus, year]);

  /* ---------- FETCH STUDENTS ---------- */
  useEffect(() => {
    if (!campus || !year || !batch) return;

    fetch(
      `${API_BASE}/api/students/students?college=${encodeURIComponent(
        campus
      )}&year=${year}&batch=${batch}`
    )
      .then(res => res.json())
      .then(setStudents)
      .catch(() => setStudents([]));
  }, [campus, year, batch]);

  const fetchMCQs = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/getAllMCQForAdmin`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      const filtered = data.filter(
        (mcq) => mcq.category === category
      );

      setMcqs(filtered);
    } catch {
      setError("Unable to load MCQs");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- HANDLE ASSIGN MCQ ---------- */
  const handleAssignMcq = async () => {
    if (!selectedMcq) {
      setAssignMessage("❌ No MCQ selected");
      return;
    }

    if (students.length === 0) {
      setAssignMessage("❌ No students found in this batch");
      return;
    }

    setAssignLoading(true);
    setAssignMessage(`Assigning to ${students.length} students...`);

    let success = 0;
    let failed = 0;

    for (const student of students) {
      try {
        await fetch(`${API_BASE}/addMcq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: student.email, mcq: selectedMcq._id })
        });
        success++;
      } catch (err) {
        console.error("Assignment failed for", student.email);
        failed++;
      }
    }

    setAssignMessage(`✅ Assigned successfully! Success: ${success}, Failed: ${failed}`);
    setAssignLoading(false);

    setTimeout(() => {
      setShowAssignModal(false);
      setCampus("");
      setYear("");
      setBatch("");
      setStudents([]);
      setAssignMessage("");
    }, 2000);
  };

  /* ---------- OPEN ASSIGN MODAL ---------- */
  const openAssignModal = (mcq) => {
    setSelectedMcq(mcq);
    setShowAssignModal(true);
    setAssignMessage("");
  };

  if (loading) return <div className="page-loader">Loading MCQs...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="mcq-page">
      <h1 className="mcq-title">{category} MCQs</h1>
      <p className="mcq-subtitle">
        Select a test to begin
      </p>

      {mcqs.length === 0 ? (
        <p className="empty-text">No MCQs available</p>
      ) : (
        <div className="mcq-grid">
          {mcqs.map((mcq) => (
            <div
              key={mcq._id}
              className="mcq-card test-card"
            >
              <h2>{mcq.topic}</h2>

              <p className="category">
                📂 {mcq.category}
              </p>

              <div className="mcq-meta">
                <span>❓ {mcq.questions.length} Questions</span>
                <span>
                  🕒 {new Date(mcq.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>

              <div className="mcq-card-actions">
                <button 
                  className="btn-view"
                  onClick={() => navigate(`/mcqs/${mcq._id}`)}
                >
                  View
                </button>
                <button 
                  className="btn-assign"
                  onClick={() => openAssignModal(mcq)}
                >
                  📤 Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ASSIGN MODAL ================= */}
      {showAssignModal && (
        <div className="assign-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="assign-modal" onClick={e => e.stopPropagation()}>
            <h2>Assign MCQ: {selectedMcq?.topic}</h2>
            
            <div className="assign-form">
              {/* CAMPUS */}
              <div className="form-group">
                <label>College</label>
                <select value={campus} onChange={e => setCampus(e.target.value)}>
                  <option value="">Select College</option>
                  {campuses.map(c => (
                    <option key={c._id} value={c.Campusname || c.name}>
                      {c.college || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* YEAR */}
              <div className="form-group">
                <label>Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} disabled={!campus}>
                  <option value="">Select Year</option>
                  {years.map(y => (
                    <option key={y._id} value={y.Year || y.year}>
                      {y.Year || y.year}
                    </option>
                  ))}
                </select>
              </div>

              {/* BATCH */}
              <div className="form-group">
                <label>Batch</label>
                <select value={batch} onChange={e => setBatch(e.target.value)} disabled={!year}>
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b.Batchname || b.batch}>
                      {b.Batchname || b.batch}
                    </option>
                  ))}
                </select>
              </div>

              {/* STUDENTS COUNT */}
              {students.length > 0 && (
                <div className="students-info">
                  <span>👥 {students.length} students will receive this MCQ</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="modal-actions">
                <button 
                  className="btn-assign-submit"
                  onClick={handleAssignMcq}
                  disabled={assignLoading || students.length === 0 || !batch}
                >
                  {assignLoading ? "Assigning..." : "✓ Assign to Batch"}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => setShowAssignModal(false)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
              </div>

              {/* MESSAGE */}
              {assignMessage && (
                <p className="assign-message">{assignMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
