import { useEffect, useState } from "react";
import "./CreateStudent.css";

const API_BASE = "https://tssplatform.onrender.com";

export default function AssignCourseOrMcq() {
  /* ---------- MASTER DATA ---------- */
  const [campuses, setCampuses] = useState([]);
  const [years, setYears] = useState([]);
  const [batches, setBatches] = useState([]);

  /* ---------- SELECTION ---------- */
  const [campus, setCampus] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");

  /* ---------- ASSIGN TYPE ---------- */
  const [assignType, setAssignType] = useState(""); // course | mcq
  const [courses, setCourses] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  /* ---------- STUDENTS ---------- */
  const [students, setStudents] = useState([]);

  /* ---------- UI STATE ---------- */
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
  }, [year]);

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
  }, [batch]);

  /* ---------- FETCH COURSES / MCQS ---------- */
  useEffect(() => {
    setSelectedItem("");

    if (assignType === "course") {
      fetch(`${API_BASE}/courses/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(setCourses)
        .catch(() => setCourses([]));
    }

    if (assignType === "mcq") {
      fetch(`${API_BASE}/getAllMCQForAdmin`)
        .then(res => res.json())
        .then(setMcqs)
        .catch(() => setMcqs([]));
    }
  }, [assignType]);

  /* ---------- ASSIGN TO BATCH ---------- */
  const handleAssign = async () => {
    if (!selectedItem) {
      setMessage("❌ Please select a course or MCQ");
      return;
    }

    if (students.length === 0) {
      setMessage("❌ No students found in this batch");
      return;
    }

    setLoading(true);
    setMessage(`Assigning to ${students.length} students...`);

    const endpoint = assignType === "course" ? "/addCourse" : "/addMcq";

    for (const student of students) {
      const payload =
        assignType === "course"
          ? { email: student.email, course: selectedItem }
          : { email: student.email, mcq: selectedItem };

      try {
        await fetch(`${API_BASE}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {}
    }

    setMessage("✅ Assigned successfully to entire batch");
    setLoading(false);
  };

  return (
    <div className="student-container">
      <h2>Assign Course / MCQ to Batch</h2>

      <div className="student-form">
        {/* COLLEGE */}
        <select value={campus} onChange={e => setCampus(e.target.value)}>
          <option value="">Select College</option>
          {campuses.map(c => (
            <option key={c._id} value={c.Campusname || c.name}>
              {c.college || c.name}
            </option>
          ))}
        </select>

        {/* YEAR */}
        <select value={year} onChange={e => setYear(e.target.value)} disabled={!campus}>
          <option value="">Select Year</option>
          {years.map(y => (
            <option key={y._id} value={y.Year || y.year}>
              {y.Year || y.year}
            </option>
          ))}
        </select>

        {/* BATCH */}
        <select value={batch} onChange={e => setBatch(e.target.value)} disabled={!year}>
          <option value="">Select Batch</option>
          {batches.map(b => (
            <option key={b._id} value={b.Batchname || b.batch}>
              {b.Batchname || b.batch}
            </option>
          ))}
        </select>

        {/* ASSIGN TYPE */}
        <select value={assignType} onChange={e => setAssignType(e.target.value)}>
          <option value="">Assign Type</option>
          <option value="course">Assign Course</option>
          <option value="mcq">Assign MCQ</option>
        </select>

        {/* COURSE SELECT */}
        {assignType === "course" && (
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* MCQ SELECT */}
        {assignType === "mcq" && (
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">Select MCQ</option>
            {mcqs.map(m => (
              <option key={m._id} value={m._id}>
                {m.topic} ({m.category})
              </option>
            ))}
          </select>
        )}

        {/* SUBMIT */}
        <button disabled={loading} onClick={handleAssign}>
          {loading ? "Assigning..." : "Assign to Batch"}
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
