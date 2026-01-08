import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./QuestionUploadPage.css";
import { getToken, logout } from "../utils/auth";

export default function QuestionUploadPage() {
  const quillContainerRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const navigate = useNavigate();
  const { questionId } = useParams();

  /* ---------------- BASIC FIELDS ---------------- */
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");

  /* ---------------- COURSE & CATEGORY ---------------- */
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  /* ---------------- TESTCASES ---------------- */
  const [sampleTestcases, setSampleTestcases] = useState([
    { input: "", output: "" }
  ]);
  const [hiddenTestcases, setHiddenTestcases] = useState([
    { input: "", output: "" }
  ]);

  /* ---------------- UI STATES ---------------- */
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  /* ---------------- QUILL INIT ---------------- */
  useEffect(() => {
    if (!quillInstanceRef.current) {
      quillInstanceRef.current = new Quill(quillContainerRef.current, {
        theme: "snow",
        placeholder: "Describe the problem clearly...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["code-block"],
            ["link"],
            ["clean"]
          ]
        }
      });

      quillInstanceRef.current.on("text-change", () => {
        setDescription(quillInstanceRef.current.root.innerHTML);
      });
    }
  }, []);

  /* ---------------- FETCH QUESTION FOR EDITING ---------------- */
  useEffect(() => {
    if (!questionId) return;

    fetch(`${process.env.REACT_APP_API_BASE_URL}questionsforadmin/${questionId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(question => {
        console.log(question);
        
        setTitle(question.title);
        setDifficulty(question.difficulty);
        setDescription(question.description);
        setCourseId(question.courseId);
        setCategoryId(question.categoryId);
        setSampleTestcases(question.sampleTestcases || [{ input: "", output: "" }]);
        setHiddenTestcases(question.hiddenTestcases || [{ input: "", output: "" }]);

        // Set Quill content after it's initialized
        setTimeout(() => {
          if (quillInstanceRef.current) {
            quillInstanceRef.current.root.innerHTML = question.description;
          }
        }, 100);
      })
      .catch(console.error);
  }, [questionId]);

  /* ---------------- FETCH COURSES ---------------- */
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}courses`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(setCourses)
      .catch(console.error);
  }, []);

  /* ---------------- FETCH CATEGORIES (BY COURSE) ---------------- */
  useEffect(() => {
    if (!courseId) {
      setCategories([]);
      setCategoryId("");
      return;
    }

    fetch(`${process.env.REACT_APP_API_BASE_URL}categories?courseId=${courseId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, [courseId]);

  /* ---------------- HELPERS ---------------- */
  const update = (list, setList, i, field, value) => {
    const updated = [...list];
    updated[i][field] = value;
    setList(updated);
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const e = {};

    if (!title.trim()) e.title = "Title is required";
    if (!courseId) e.courseId = "Course is required";
    if (!categoryId) e.categoryId = "Category is required";

    if (!description || description === "<p><br></p>")
      e.description = "Description is required";

    if (!sampleTestcases.some(t => t.input.trim() && t.output.trim()))
      e.sampleTestcases = "At least one valid sample testcase is required";

    if (!hiddenTestcases.some(t => t.input.trim() && t.output.trim()))
      e.hiddenTestcases = "At least one valid hidden testcase is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const isEditing = !!questionId;
      const url = isEditing ? `${process.env.REACT_APP_API_BASE_URL}questions/${questionId}` : `${process.env.REACT_APP_API_BASE_URL}questions`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          courseId,
          categoryId,
          sampleTestcases,
          hiddenTestcases
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed");

      setShowPopup(true);

      if (!isEditing) {
        /* RESET FORM */
        setTitle("");
        setDifficulty("Easy");
        setCourseId("");
        setCategoryId("");
        setDescription("");
        quillInstanceRef.current.root.innerHTML = "";
        setSampleTestcases([{ input: "", output: "" }]);
        setHiddenTestcases([{ input: "", output: "" }]);
        setErrors({});
      }
      setTitle("");
        setDifficulty("Easy");
        setCourseId("");
        setCategoryId("");
        setDescription("");
        quillInstanceRef.current.root.innerHTML = "";
        setSampleTestcases([{ input: "", output: "" }]);
        setHiddenTestcases([{ input: "", output: "" }]);
        setErrors({});
    } catch (err) {
      alert(`Error ${questionId ? 'updating' : 'creating'} question`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-root">
      <div className="main-card">

        <h2 className="page-heading">Create Question</h2>

        {/* TITLE */}
        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        {/* COURSE */}
        <div className="form-group">
          <label>Course</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {errors.courseId && <p className="error-text">{errors.courseId}</p>}
        </div>

        {/* CATEGORY */}
        <div className="form-group">
          <label>Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            disabled={!courseId}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="error-text">{errors.categoryId}</p>}
        </div>

        {/* DIFFICULTY */}
        <div className="form-group">
          <label>Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label>Description</label>
          <div ref={quillContainerRef} className="quill-box" />
          {errors.description && <p className="error-text">{errors.description}</p>}
        </div>

        {/* SAMPLE TESTCASES */}
        <div className="section-title">Sample Testcases</div>
        {sampleTestcases.map((t, i) => (
          <div className="testcase-row" key={i}>
            <textarea placeholder="Input" value={t.input}
              onChange={e => update(sampleTestcases, setSampleTestcases, i, "input", e.target.value)} />
            <textarea placeholder="Output" value={t.output}
              onChange={e => update(sampleTestcases, setSampleTestcases, i, "output", e.target.value)} />
          </div>
        ))}
        {errors.sampleTestcases && <p className="error-text">{errors.sampleTestcases}</p>}

        <button className="link-btn"
          onClick={() => setSampleTestcases([...sampleTestcases, { input: "", output: "" }])}>
          Add Sample Testcase
        </button>

        {/* HIDDEN TESTCASES */}
        <div className="section-title">Hidden Testcases</div>
        {hiddenTestcases.map((t, i) => (
          <div className="testcase-row" key={i}>
            <textarea placeholder="Input" value={t.input}
              onChange={e => update(hiddenTestcases, setHiddenTestcases, i, "input", e.target.value)} />
            <textarea placeholder="Output" value={t.output}
              onChange={e => update(hiddenTestcases, setHiddenTestcases, i, "output", e.target.value)} />
          </div>
        ))}
        {errors.hiddenTestcases && <p className="error-text">{errors.hiddenTestcases}</p>}

        <button className="link-btn"
          onClick={() => setHiddenTestcases([...hiddenTestcases, { input: "", output: "" }])}>
          Add Hidden Testcase
        </button>

        {/* SUBMIT */}
        <div className="footer">
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? (questionId ? "Updating..." : "Publishing...") : (questionId ? "Update Question" : "Publish Question")}
          </button>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>✅ Question {questionId ? 'Updated' : 'Created'}</h3>
            <p>Your question has been {questionId ? 'updated' : 'published'} successfully.</p>
            <button className="primary-btn" onClick={() => setShowPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
