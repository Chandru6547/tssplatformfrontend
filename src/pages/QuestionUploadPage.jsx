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

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [isPredefinedOnly, setIsPredefinedOnly] = useState(false);
  const [predefinedCode, setPredefinedCode] = useState([
    { language: "python", code: "" },
    { language: "c", code: "" },
    { language: "cpp", code: "" },
    { language: "java", code: "" }
  ]);

  const [sampleTestcases, setSampleTestcases] = useState([
    { input: "", output: "" }
  ]);
  const [hiddenTestcases, setHiddenTestcases] = useState([
    { input: "", output: "" }
  ]);

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

    fetch(
      `${process.env.REACT_APP_API_BASE_URL}/questionsforadmin/${questionId}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
      .then(res => res.json())
      .then(question => {
        setTitle(question.title);
        setDifficulty(question.difficulty);
        setDescription(question.description);
        setCourseId(question.courseId);
        setCategoryId(question.categoryId);
        setSampleTestcases(question.sampleTestcases || [{ input: "", output: "" }]);
        setHiddenTestcases(question.hiddenTestcases || [{ input: "", output: "" }]);

        /* ⭐ LOAD PREDEFINED DATA */
        setIsPredefinedOnly(question.isPredefinedOnly || false);
        if (question.predefinedCode) {
          setPredefinedCode(question.predefinedCode);
        }

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
    fetch(`${process.env.REACT_APP_API_BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(setCourses)
      .catch(console.error);
  }, []);

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    if (!courseId) {
      setCategories([]);
      setCategoryId("");
      return;
    }

    fetch(
      `${process.env.REACT_APP_API_BASE_URL}/categories?courseId=${courseId}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
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

  const updatePredefined = (lang, value) => {
    setPredefinedCode(prev =>
      prev.map(p => (p.language === lang ? { ...p, code: value } : p))
    );
  };

  /* ---------------- VALIDATION (UNCHANGED + ADDITION) ---------------- */
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

    if (isPredefinedOnly) {
      const hasCode = predefinedCode.some(p => p.code.trim());
      if (!hasCode)
        e.predefinedCode = "Add predefined code for at least one language";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const isEditing = !!questionId;
      const url = isEditing
        ? `${process.env.REACT_APP_API_BASE_URL}/questions/${questionId}`
        : `${process.env.REACT_APP_API_BASE_URL}/questions`;

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
          hiddenTestcases,

          /* ⭐ PREDEFINED PAYLOAD */
          isPredefinedOnly,
          predefinedCode: isPredefinedOnly ? predefinedCode : []
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed");

      setShowPopup(true);
    } catch (err) {
      alert(`Error ${questionId ? "updating" : "creating"} question`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="page-root">
      <div className="main-card">
        {/* Header Section */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              {questionId ? "✏️ Edit Question" : "➕ Create New Question"}
            </h1>
            <p className="page-subtitle">
              {questionId
                ? "Update the question details and test cases"
                : "Fill in the details to create a programming question"
              }
            </p>
          </div>
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>

        {/* Basic Information Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">📋 Basic Information</h3>
            <div className="section-divider"></div>
          </div>

          <div className="form-grid">
            {/* TITLE */}
            <div className="form-group full-width">
              <label className="form-label">
                <span className="label-icon">📝</span>
                Question Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a clear, descriptive title..."
                className={errors.title ? "error" : ""}
              />
              {errors.title && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {errors.title}
                </div>
              )}
            </div>

            {/* COURSE & CATEGORY */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🎓</span>
                Course
              </label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className={errors.courseId ? "error" : ""}
              >
                <option value="">Select a course...</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.courseId && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {errors.courseId}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📂</span>
                Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={!courseId}
                className={errors.categoryId ? "error" : ""}
              >
                <option value="">
                  {courseId ? "Select a category..." : "Select course first"}
                </option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {errors.categoryId}
                </div>
              )}
            </div>

            {/* DIFFICULTY */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📊</span>
                Difficulty Level
              </label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">📖 Problem Description</h3>
            <div className="section-divider"></div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📝</span>
              Detailed Description
            </label>
            <div className={`quill-wrapper ${errors.description ? "error" : ""}`}>
              <div ref={quillContainerRef} className="quill-box" />
            </div>
            {errors.description && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {errors.description}
              </div>
            )}
          </div>
        </div>

        {/* Predefined Code Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">💻 Starter Code (Optional)</h3>
            <div className="section-divider"></div>
          </div>

          <div className="predefined-toggle">
            <input
              type="checkbox"
              id="predefined-toggle"
              checked={isPredefinedOnly}
              onChange={e => setIsPredefinedOnly(e.target.checked)}
            />
            <label htmlFor="predefined-toggle" className="toggle-label">
              Provide starter code templates for students
            </label>
          </div>

          {isPredefinedOnly && (
            <div className="predefined-section">
              <div className="code-grid">
                {predefinedCode.map(p => (
                  <div className="code-block" key={p.language}>
                    <div className="code-header">
                      <span className="language-badge">{p.language.toUpperCase()}</span>
                    </div>
                    <textarea
                      value={p.code}
                      onChange={e => updatePredefined(p.language, e.target.value)}
                      placeholder={`// Write ${p.language} starter code here...`}
                      className="code-textarea"
                      spellCheck="false"
                    />
                  </div>
                ))}
              </div>
              {errors.predefinedCode && (
                <div className="error-message section-error">
                  <span className="error-icon">⚠️</span>
                  {errors.predefinedCode}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Cases Section */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">🧪 Test Cases</h3>
            <div className="section-divider"></div>
          </div>

          {/* Sample Test Cases */}
          <div className="testcase-section">
            <div className="testcase-header">
              <h4 className="testcase-title">Sample Test Cases</h4>
              <span className="testcase-info">Visible to students</span>
            </div>

            <div className="testcase-list">
              {sampleTestcases.map((testcase, i) => (
                <div className="testcase-item" key={i}>
                  <div className="testcase-number">#{i + 1}</div>
                  <div className="testcase-inputs">
                    <div className="input-group">
                      <label className="input-label">Input</label>
                      <textarea
                        value={testcase.input}
                        onChange={e => update(sampleTestcases, setSampleTestcases, i, "input", e.target.value)}
                        placeholder="Enter test input..."
                        className="testcase-textarea"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Expected Output</label>
                      <textarea
                        value={testcase.output}
                        onChange={e => update(sampleTestcases, setSampleTestcases, i, "output", e.target.value)}
                        placeholder="Enter expected output..."
                        className="testcase-textarea"
                      />
                    </div>
                  </div>
                  {sampleTestcases.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        const updated = sampleTestcases.filter((_, idx) => idx !== i);
                        setSampleTestcases(updated);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-testcase-btn"
              onClick={() => setSampleTestcases([...sampleTestcases, { input: "", output: "" }])}
            >
              <span className="btn-icon">+</span>
              Add Sample Test Case
            </button>

            {errors.sampleTestcases && (
              <div className="error-message section-error">
                <span className="error-icon">⚠️</span>
                {errors.sampleTestcases}
              </div>
            )}
          </div>

          {/* Hidden Test Cases */}
          <div className="testcase-section">
            <div className="testcase-header">
              <h4 className="testcase-title">Hidden Test Cases</h4>
              <span className="testcase-info">Used for evaluation only</span>
            </div>

            <div className="testcase-list">
              {hiddenTestcases.map((testcase, i) => (
                <div className="testcase-item" key={i}>
                  <div className="testcase-number">#{i + 1}</div>
                  <div className="testcase-inputs">
                    <div className="input-group">
                      <label className="input-label">Input</label>
                      <textarea
                        value={testcase.input}
                        onChange={e => update(hiddenTestcases, setHiddenTestcases, i, "input", e.target.value)}
                        placeholder="Enter test input..."
                        className="testcase-textarea"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Expected Output</label>
                      <textarea
                        value={testcase.output}
                        onChange={e => update(hiddenTestcases, setHiddenTestcases, i, "output", e.target.value)}
                        placeholder="Enter expected output..."
                        className="testcase-textarea"
                      />
                    </div>
                  </div>
                  {hiddenTestcases.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        const updated = hiddenTestcases.filter((_, idx) => idx !== i);
                        setHiddenTestcases(updated);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-testcase-btn"
              onClick={() => setHiddenTestcases([...hiddenTestcases, { input: "", output: "" }])}
            >
              <span className="btn-icon">+</span>
              Add Hidden Test Case
            </button>

            {errors.hiddenTestcases && (
              <div className="error-message section-error">
                <span className="error-icon">⚠️</span>
                {errors.hiddenTestcases}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                {questionId ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <span className="btn-icon">✓</span>
                {questionId ? "Update Question" : "Create Question"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card success-popup">
            <div className="popup-icon">🎉</div>
            <h3 className="popup-title">Success!</h3>
            <p className="popup-message">
              Question has been {questionId ? "updated" : "created"} successfully.
            </p>
            <div className="popup-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowPopup(false);
                  window.history.back();
                }}
              >
                Back to List
              </button>
              <button
                className="primary-btn"
                onClick={() => setShowPopup(false)}
              >
                {questionId ? "Continue Editing" : "Create Another"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
