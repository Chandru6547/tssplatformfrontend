import { useEffect, useState } from "react";
import "./CreateStudent.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [assignType, setAssignType] = useState(""); // course | mcq | assignment
  const [courses, setCourses] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [assignments, setAssignments] = useState([]);
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

  /* ---------- FETCH ITEMS BASED ON ASSIGN TYPE ---------- */
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

    if (assignType === "assignment") {
      fetch(`${API_BASE}/api/assignments`)
        .then(res => res.json())
        .then(setAssignments)
        .catch(() => setAssignments([]));
    }
  }, [assignType]);

  /* ---------- ASSIGN TO BATCH ---------- */
  const handleAssign = async () => {
    if (!assignType || !selectedItem) {
      setMessage("❌ Please select assign type and item");
      return;
    }

    if (students.length === 0) {
      setMessage("❌ No students found in this batch");
      return;
    }

    setLoading(true);
    setMessage(`Assigning to ${students.length} students...`);

    let endpoint = "";
    let payloadBuilder = null;

    if (assignType === "course") {
      endpoint = "/addCourse";
      payloadBuilder = email => ({ email, course: selectedItem });
    }

    if (assignType === "mcq") {
      endpoint = "/addMcq";
      payloadBuilder = email => ({ email, mcq: selectedItem });
    }

    if (assignType === "assignment") {
      endpoint = "/addAssignmentToUser";
      payloadBuilder = email => ({
        email,
        assignmentId: selectedItem
      });
    }

    for (const student of students) {
      try {
        await fetch(`${API_BASE}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadBuilder(student.email))
        });
      } catch (err) {
        console.error("Assignment failed for", student.email);
      }
    }

    setMessage("✅ Assigned successfully to entire batch");
    setLoading(false);
  };

  return (
    <div className="student-container">
      <h2>Assign Course / MCQ / Assignment to Batch</h2>

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
          <option value="assignment">Assign Assignment</option>
        </select>

        {/* COURSE */}
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

        {/* MCQ */}
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

        {/* ASSIGNMENT */}
        {assignType === "assignment" && (
          <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">Select Assignment</option>
            {assignments.map(a => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        <button disabled={loading} onClick={handleAssign}>
          {loading ? "Assigning..." : "Assign to Batch"}
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
  