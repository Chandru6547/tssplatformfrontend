import { useEffect, useState } from "react";
import "./HumanLoader.css";

export default function HumanLoader({
  loadingText = "Building your code",
  successText = "Build successful",
  duration = 2000
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="human-loader-wrapper">
      {!done ? (
        <>
          {/* CODE BUILD STATE */}
          <div className="code-loader">
            <span>{"{"}</span>
            <span>{"}"}</span>
            <span>{"< />"}</span>
          </div>

          <p className="loader-text">
            {loadingText}
            <span className="dots">
              <i>.</i><i>.</i><i>.</i>
            </span>
          </p>
        </>
      ) : (
        <>
          {/* SUCCESS STATE */}
          <div className="success-check">✓</div>
          <p className="success-text">{successText}</p>
        </>
      )}
    </div>
  );
}
