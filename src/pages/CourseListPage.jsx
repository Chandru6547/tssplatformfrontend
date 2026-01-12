import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getRole, logout, getUserId } from "../utils/auth";
import "./CourseListPage.css";

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const navigate = useNavigate();
  const role = getRole();

  /* ---------- FETCH COURSES (MIN 2s LOADER) ---------- */
  const fetchCourses = async () => {
    setPageLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch(
        "https://tssplatform.onrender.com/courses/student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ studentId: getUserId() })
        }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(3000 - elapsed, 0);
      setTimeout(() => setPageLoading(false), remaining);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /* ---------- ADD COURSE ---------- */
  const handleAddCourse = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        "https://tssplatform.onrender.com/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ name, description })
        }
      );

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      setName("");
      setDescription("");
      setShowAddDialog(false);
      fetchCourses();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- JUMPING PEOPLE LOADER ---------- */
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
        Loading courses
        <span className="dots">
          <i>.</i><i>.</i><i>.</i>
        </span>
      </p>
    </div>
  );
}

  return (
    <div className="course-page">
      <div className="course-header">
        <div>
          <h2>Select Your Course</h2>
          <p>Choose a course to explore its categories and problems</p>
        </div>

        {role === "admin" && (
          <button
            className="add-course-btn"
            onClick={() => setShowAddDialog(true)}
          >
            + Add Course
          </button>
        )}
      </div>

      <div className="course-grid">
        {courses.map(course => (
          <div key={course._id} className="course-card">
            <h3>{course.name}</h3>

            <button
              className="course-btn"
              onClick={() =>
                navigate(`/courses/${course._id}/categories`)
              }
            >
              View Categories →
            </button>
          </div>
        ))}
      </div>

      {role === "admin" && showAddDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Add Course</h3>

            <input
              className="dialog-input"
              placeholder="Course name"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <textarea
              className="dialog-textarea"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <div className="dialog-actions">
              <button
                className="dialog-cancel"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </button>
              <button
                className="dialog-confirm"
                onClick={handleAddCourse}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
