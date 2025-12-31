import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { getToken, logout, getUserId } from "../utils/auth";
import "./SolveQuestionPage.css";

export default function SolveQuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH QUESTION ---------------- */
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`https://tssplatform.onrender.com/questions/${id}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });

        if (res.status === 401 || res.status === 403) {
          logout();
          navigate("/login");
          return;
        }

        const data = await res.json();
        setQuestion(data);
      } catch (err) {
        console.error("Failed to load question", err);
      }
    };

    fetchQuestion();
  }, [id, navigate]);

  /* ---------------- RUN SAMPLE ---------------- */
  const runSample = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("https://tssplatform.onrender.com/run", {
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

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Execution failed" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const submitHidden = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("https://tssplatform.onrender.com/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          language,
          code,
          questionId: id,
          studentId: getUserId()
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!question) {
    return <p style={{ padding: 40 }}>Loading question...</p>;
  }

  return (
    <div className="compiler-root">
      <div className="compiler-container solve-layout">

        {/* LEFT PANEL */}
        <div className="solve-left">
          <div className="solve-card">
            <h2 className="solve-title">{question.title}</h2>

            <div
              className="solve-description"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />

            <h3 className="section-heading">Sample Testcases</h3>

            <div className="table-wrapper">
              <table className="sample-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Input</th>
                    <th>Expected Output</th>
                  </tr>
                </thead>
                <tbody>
                  {question.sampleTestcases.map((tc, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><pre>{tc.input}</pre></td>
                      <td><pre>{tc.output}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="solve-right">
          <div className="solve-card">
            <div className="editor-top-bar">
              <select
                className="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <CodeEditor
              language={language}
              code={code}
              setCode={setCode}
            />

            <div className="action-bar">
              <button
                className="action-btn run"
                onClick={runSample}
                disabled={loading}
              >
                ▶ Run
              </button>

              <button
                className="action-btn submit"
                onClick={submitHidden}
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
        <div className="compiler-container">
          <div className="solve-card result-card">

            {result.error && (
              <div className="fail">{result.error}</div>
            )}

            {result.verdict && (
              <>
                <div className={`verdict ${result.verdict === "AC" ? "pass" : "fail"}`}>
                  Verdict: {result.verdict}
                </div>

                <div className="score">
                  Passed {result.passed} / {result.total}
                </div>

                <div className="testcase-list">
                  {result.results.map((tc, i) => (
                    <div
                      key={i}
                      className={`testcase-card ${tc.status === "PASS" ? "tc-pass" : "tc-fail"}`}
                    >
                      <div className="tc-header">
                        <span>Test Case #{i + 1}</span>
                        <span className={`tc-status ${tc.status.toLowerCase()}`}>
                          {tc.status}
                        </span>
                      </div>

                      <div className="tc-row">
                        <strong>Input</strong>
                        <pre>{tc.input}</pre>
                      </div>

                      <div className="tc-row">
                        <strong>Expected</strong>
                        <pre>{tc.expected}</pre>
                      </div>

                      <div className="tc-row">
                        <strong>Actual</strong>
                        <pre>{tc.actual}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
