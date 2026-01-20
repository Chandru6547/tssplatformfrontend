import { useState, useRef, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import "./CompilerPage.css";

export default function CompilerPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [needsInput, setNeedsInput] = useState(true);

  const [testcases, setTestcases] = useState([{ input: "", output: "" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedWarning, setExpandedWarning] = useState(null);
  
  const resultRef = useRef(null);

  /* ---------- AUTO SCROLL TO RESULT ---------- */
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [result]);

  const runCode = async () => {
    setLoading(true);
    setResult(null);

    const endpoint = needsInput ? "/run" : "/run-code-alone";

    const payload = needsInput
      ? { language, code, testcases }
      : { language, code };

    try {
      const res = await fetch(
        `https://tssplatform.onrender.com${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

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

  /* ---------- PARSE WARNINGS ---------- */
  const parseWarnings = (errorText) => {
    if (!errorText) return [];
    
    const lines = errorText.split('\n');
    const warnings = [];
    let currentWarning = null;

    lines.forEach((line) => {
      // Match warning line format: /path/file.c:1:1: warning: message
      const warningMatch = line.match(/^(.*?):(\d+):(\d+):\s*(warning|error):\s*(.+)$/);
      
      if (warningMatch) {
        if (currentWarning) {
          warnings.push(currentWarning);
        }
        currentWarning = {
          file: warningMatch[1],
          line: warningMatch[2],
          col: warningMatch[3],
          type: warningMatch[4],
          message: warningMatch[5],
          details: []
        };
      } else if (currentWarning && line.trim()) {
        currentWarning.details.push(line);
      }
    });

    if (currentWarning) {
      warnings.push(currentWarning);
    }

    return warnings;
  };

  return (
    <div className="compiler-root">
      <div className="compiler-container">

        {/* ================= EDITOR ================= */}
        <div className="editor-card material-card">
          <div className="editor-header">
            <h2>IDE</h2>

            <div className="editor-controls">
              {/* LANGUAGE */}
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

              {/* INPUT TOGGLE */}
              <div className="toggle-wrapper">
                <span>Needs Input</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={needsInput}
                    onChange={() => setNeedsInput(!needsInput)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
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

        {/* ================= RESULT SUMMARY ================= */}
        {result && (
          <div className="result-card material-card" ref={resultRef}>
            {result.error && (
              <div className="warnings-section">
                <div className="warnings-header">
                  <span className="warning-icon">⚠️</span>
                  <h3>Compiler Warnings</h3>
                  <span className="warning-count">{parseWarnings(result.error).length}</span>
                </div>

                <div className="warnings-list">
                  {parseWarnings(result.error).map((warning, idx) => (
                    <div key={idx} className="warning-item">
                      <div 
                        className="warning-header-item"
                        onClick={() => setExpandedWarning(expandedWarning === idx ? null : idx)}
                      >
                        <span className="warning-toggle">
                          {expandedWarning === idx ? '▼' : '▶'}
                        </span>
                        <span className={`warning-type ${warning.type}`}>
                          {warning.type.toUpperCase()}
                        </span>
                        <span className="warning-location">
                          {warning.file.split('/').pop()}:{warning.line}:{warning.col}
                        </span>
                        <span className="warning-message">{warning.message}</span>
                      </div>

                      {expandedWarning === idx && warning.details.length > 0 && (
                        <div className="warning-details">
                          {warning.details.map((detail, dIdx) => (
                            <div key={dIdx} className="detail-line">
                              <pre>{detail}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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

            {/* CODE ALONE OUTPUT */}
            {!needsInput && result.output && (
              <div className="code-output">
                <h4>Output</h4>
                <pre>{result.output}</pre>
              </div>
            )}
          </div>
        )}

        {/* ================= TESTCASE RESULTS ================= */}
        {needsInput && result?.results && (
          <div className="testcase-section material-card">
            <h3>Testcase Results</h3>

            <table className="result-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Input</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((tc, i) => (
                  <tr key={i} className={tc.status === "PASS" ? "row-pass" : "row-fail"}>
                    <td>{i + 1}</td>
                    <td><pre>{tc.input || "—"}</pre></td>
                    <td><pre>{tc.expected || "—"}</pre></td>
                    <td><pre>{tc.actual || tc.error || "—"}</pre></td>
                    <td>
                      <span className={`status ${tc.status === "PASS" ? "pass" : "fail"}`}>
                        {tc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TESTCASE INPUT ================= */}
        {needsInput && (
          <div className="testcase-section material-card">
            <div className="testcase-header">
              <h3>Test Cases</h3>
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
        )}

      </div>
    </div>
  );
}
