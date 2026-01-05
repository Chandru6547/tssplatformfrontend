import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import "./CompilerPage.css";

export default function CompilerPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [testcases, setTestcases] = useState([{ input: "", output: "" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, testcases })
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "⚠️ Server not reachable" });
    }
    setLoading(false);
  };

  const updateTestcase = (i, field, value) => {
    const updated = [...testcases];
    updated[i][field] = value;
    setTestcases(updated);
  };

  return (
    <div className="compiler-root">
      <div className="compiler-container">

        {/* EDITOR */}
        <div className="editor-card material-card">
          <div className="editor-header">
            <h2>Online Compiler</h2>

            <div className="select-wrapper">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          <CodeEditor language={language} code={code} setCode={setCode} />

          <button
            className="run-btn"
            onClick={runCode}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Running...
              </>
            ) : (
              "▶ Run Code"
            )}
          </button>
        </div>

        {/* SUMMARY RESULT */}
        {result && (
          <div className="result-card material-card">
            {result.error && (
              <div className="result-error">{result.error}</div>
            )}

            {result.verdict && (
              <>
                <div
                  className={`result-chip ${
                    result.verdict === "AC" ? "success" : "failure"
                  }`}
                >
                  {result.verdict === "AC" ? "Accepted ✔" : "Wrong Answer ✖"}
                </div>

                <div className="result-summary">
                  Passed <strong>{result.passed}</strong> / {result.total}
                </div>
              </>
            )}
          </div>
        )}

        {/* DETAILED TESTCASE RESULTS */}
        {result?.results && (
          <div className="testcase-section material-card">
            <h3>Testcase Results</h3>

            <div className="testcase-grid">
              {result.results.map((tc, i) => (
                <div
                  key={i}
                  className={`testcase-card ${
                    tc.status === "PASS" ? "tc-pass" : "tc-fail"
                  }`}
                >
                  <div className="testcase-title">
                    Testcase {tc.testcase}
                    <span
                      className={`tc-status ${
                        tc.status === "PASS" ? "pass" : "fail"
                      }`}
                    >
                      {tc.status}
                    </span>
                  </div>

                  <div className="tc-block">
                    <label>Input</label>
                    <pre>{tc.input || "—"}</pre>
                  </div>

                  <div className="tc-block">
                    <label>Expected Output</label>
                    <pre>{tc.expected || "—"}</pre>
                  </div>

                  <div className="tc-block">
                    <label>Actual Output</label>
                    <pre>{tc.actual || tc.error || "—"}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TESTCASE INPUT CREATION */}
        <div className="testcase-section material-card">
          <div className="testcase-header">
            <h3>Test Cases (Input)</h3>
            <button
              className="add-btn"
              onClick={() =>
                setTestcases([...testcases, { input: "", output: "" }])
              }
            >
              + Add
            </button>
          </div>

          <div className="testcase-grid">
            {testcases.map((tc, i) => (
              <div className="testcase-card" key={i}>
                <div className="testcase-title">Testcase {i + 1}</div>

                <textarea
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) =>
                    updateTestcase(i, "input", e.target.value)
                  }
                />

                <textarea
                  placeholder="Expected Output"
                  value={tc.output}
                  onChange={(e) =>
                    updateTestcase(i, "output", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
