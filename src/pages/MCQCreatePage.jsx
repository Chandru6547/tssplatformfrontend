import { useState } from "react";
import * as XLSX from "xlsx";
import { createMCQ } from "../api/mcq.api";
import "./MCQCreatePage.css";

export default function MCQCreatePage() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState([
    {
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      explanation: ""
    }
  ]);

  /* ---------------- MANUAL FORM HANDLERS ---------------- */
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        explanation: ""
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  /* ---------------- EXCEL UPLOAD ---------------- */
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const excelQuestions = rows.map((row, index) => ({
        question: row.question || "",
        optionA: row.optionA || "",
        optionB: row.optionB || "",
        optionC: row.optionC || "",
        optionD: row.optionD || "",
        correctOption: row.correctOption || "A",
        explanation: row.explanation || ""
      }));

      if (excelQuestions.length === 0) {
        alert("No valid MCQs found in Excel file");
        return;
      }

      setQuestions(prev => [...prev, ...excelQuestions]);
    };

    reader.readAsArrayBuffer(file);
  };

  /* ---------------- VALIDATION ---------------- */
  const isFormValid =
    topic.trim() &&
    category.trim() &&
    questions.every(
      q =>
        q.question &&
        q.optionA &&
        q.optionB &&
        q.optionC &&
        q.optionD &&
        ["A", "B", "C", "D"].includes(q.correctOption)
    );

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createMCQ({ topic, category, questions });

      alert("MCQ created successfully 🎉");

      setTopic("");
      setCategory("");
      setQuestions([
        {
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctOption: "A",
          explanation: ""
        }
      ]);
    } catch (err) {
      alert("Failed to create MCQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mcq-create-page">
      <h2 className="page-title">Create MCQs</h2>

      {/* Topic & Category */}
      <div className="mcq-meta">
        <div className="field">
          <label>Topic</label>
          <input
            placeholder="e.g. Arrays"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Category</label>
          <input
            placeholder="e.g. DSA"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
        </div>
      </div>

      <div className="excel-upload">
        <label>Upload MCQs via Excel (.xlsx)</label>

          <label className="upload-box">
            📂 Click to upload Excel file
            <input
              type="file"
              accept=".xlsx"
              onChange={handleExcelUpload}
            />
          </label>

          <small>
            Columns required: question, optionA, optionB, optionC, optionD,
            correctOption, explanation
          </small>
        </div>


      {/* Questions */}
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <div className="question-header">
            <h3>Question {i + 1}</h3>

            {questions.length > 1 && (
              <button
                type="button"
                className="delete-question-btn"
                onClick={() => removeQuestion(i)}
              >
                🗑️ Delete
              </button>
            )}
          </div>

          <textarea
            placeholder="Enter question"
            value={q.question}
            onChange={e => updateQuestion(i, "question", e.target.value)}
          />

          <div className="options-grid">
            <input placeholder="Option A" value={q.optionA} onChange={e => updateQuestion(i, "optionA", e.target.value)} />
            <input placeholder="Option B" value={q.optionB} onChange={e => updateQuestion(i, "optionB", e.target.value)} />
            <input placeholder="Option C" value={q.optionC} onChange={e => updateQuestion(i, "optionC", e.target.value)} />
            <input placeholder="Option D" value={q.optionD} onChange={e => updateQuestion(i, "optionD", e.target.value)} />
          </div>

          <div className="question-footer">
            <div className="field">
              <label>Correct Option</label>
              <select
                value={q.correctOption}
                onChange={e => updateQuestion(i, "correctOption", e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="field">
              <label>Explanation (optional)</label>
              <input
                placeholder="Why this is correct?"
                value={q.explanation}
                onChange={e => updateQuestion(i, "explanation", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="actions">
        <button type="button" className="secondary" onClick={addQuestion}>
          + Add Question
        </button>

        <button
          type="button"
          className="primary"
          disabled={!isFormValid || loading}
          onClick={handleSubmit}
        >
          {loading ? "Submitting..." : "Submit MCQ"}
        </button>
      </div>
    </div>
  );
}
