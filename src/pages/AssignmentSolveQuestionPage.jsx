import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { getToken, logout, getUserId } from "../utils/auth";
import "./AssignmentSolveQuestionPage.css";

export default function AssignmentSolveQuestionPage() {
  const { assignmentId, questionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------- FULLSCREEN ---------- */
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };

    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  /* ---------- FETCH QUESTION ---------- */
  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/questions/${questionId}`,
          {
            headers: { Authorization: `Bearer ${getToken()}` }
          }
        );

        if (res.status === 401 || res.status === 403) {
          logout();
          navigate("/login");
          return;
        }

        setQuestion(await res.json());
      } catch (err) {
        console.error("Failed to load question", err);
      }
    }

    fetchQuestion();
  }, [questionId, navigate]);

  /* ---------- RUN SAMPLE ---------- */
  const runSample = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          language,
          code,
          testcases: question.sampleTestcases
        })
      });

      setResult(await res.json());
    } catch {
      setResult({ error: "Execution failed" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SUBMIT ASSIGNMENT ---------- */
  const submitAssignment = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          language,
          code,
          questionId,
          assignmentId,
          studentId: getUserId()
        })
      });

      const data = await res.json();
      setResult(data);

      if (data.verdict === "AC") {
        setTimeout(() => {
          navigate(`/assignments/solve/${assignmentId}`);
        }, 1500);
      }
    } catch {
      setResult({ error: "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!question) {
    return <div className="assignment-loader">Loading question...</div>;
  }

  return (
    <div className="compiler-root">
      <div className="solve-layout">

        {/* LEFT */}
        <div className="solve-left">
          <div className="question-panel">
            <div className="question-header">
              <h1>{question.title}</h1>
              <span className={`difficulty ${question.difficulty?.toLowerCase()}`}>
                {question.difficulty}
              </span>
            </div>

            <div
              className="question-description"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />

            <h3 className="section-heading">Sample Testcases</h3>

            <div className="sample-list">
              {question.sampleTestcases.map((tc, i) => (
                <div key={i} className="sample-card">
                  <strong>Input</strong>
                  <pre>{tc.input}</pre>
                  <strong>Output</strong>
                  <pre>{tc.output}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="solve-right">
          <div className="editor-shell">
            <div className="editor-top-bar">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <CodeEditor language={language} code={code} setCode={setCode} />

            <div className="action-bar">
              <button onClick={runSample} disabled={loading}>
                ▶ Run
              </button>
              <button
                className="submit"
                onClick={submitAssignment}
                disabled={loading}
              >
                🚀 Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="result-panel">
          <span
            className={`summary-verdict ${
              result.verdict === "AC" ? "ok" : "fail"
            }`}
          >
            {result.verdict === "AC" ? "✔ Accepted" : "✖ Wrong Answer"}
          </span>
          <span className="summary-count">
            {result.passed} / {result.total} testcases passed
          </span>
        </div>
      )}
    </div>
  );
}
