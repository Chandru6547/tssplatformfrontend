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
  const [selectedBatches, setSelectedBatches] = useState([]);

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
        setSelectedBatches([]);
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
        setSelectedBatches([]);
      });
  }, [campus, year]);

  /* ---------- FETCH STUDENTS (MULTI BATCH) ---------- */
  useEffect(() => {
    if (!campus || !year || selectedBatches.length === 0) return;

    const fetchStudents = async () => {
      try {
        let allStudents = [];

        for (const batch of selectedBatches) {
          const res = await fetch(
            `${API_BASE}/api/students/students?college=${encodeURIComponent(
              campus
            )}&year=${year}&batch=${batch}`
          );

          const data = await res.json();
          allStudents.push(...data);
        }

        /* remove duplicate students by email */
        const uniqueStudents = Array.from(
          new Map(allStudents.map(s => [s.email, s])).values()
        );

        setStudents(uniqueStudents);
      } catch (err) {
        setStudents([]);
      }
    };

    fetchStudents();
  }, [campus, year, selectedBatches]);

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
      setMessage("❌ No students found in selected batches");
      return;
    }

    setLoading(true);
    setMessage(`Assigning to ${students.length} students...`);

    let endpoint = "";
    let payloadBuilder = null;

    /* ---------- STUDENT ENDPOINTS ---------- */
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
      payloadBuilder = email => ({ email, assignmentId: selectedItem });
    }

    /* ---------- ASSIGN TO STUDENTS ---------- */
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

    /* ---------- ASSIGN TO STAFF (ONCE) ---------- */
    try {
      if (assignType === "course") {
        await fetch(`${API_BASE}/api/staff/addCourse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college: campus,
            course: selectedItem
          })
        });
      }

      if (assignType === "mcq") {
        await fetch(`${API_BASE}/api/staff/addMcq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college: campus,
            mcq: selectedItem
          })
        });
      }

      if (assignType === "assignment") {
        await fetch(`${API_BASE}/api/staff/addAssignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college: campus,
            assignmentId: selectedItem
          })
        });
      }
    } catch (err) {
      console.error("Staff assignment failed", err);
    }

    setMessage("✅ Assigned successfully to students & staff");
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
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          disabled={!campus}
        >
          <option value="">Select Year</option>
          {years.map(y => (
            <option key={y._id} value={y.Year || y.year}>
              {y.Year || y.year}
            </option>
          ))}
        </select>

        {/* BATCH CHECKBOXES */}
        {batches.length > 0 && (
          <div className="batch-checkbox-group">
            <p className="label">Select Batches</p>

            {batches.map(b => {
              const value = b.Batchname || b.batch;

              return (
                <label key={b._id} className="batch-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedBatches.includes(value)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setSelectedBatches(prev =>
                        checked
                          ? [...prev, value]
                          : prev.filter(v => v !== value)
                      );
                    }}
                  />
                  {value}
                </label>
              );
            })}
          </div>
        )}

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
          {loading ? "Assigning..." : "Assign to Selected Batches"}
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
