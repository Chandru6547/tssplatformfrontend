import { useEffect, useState } from "react";
import "./HumanLoader.css";

export default function HumanLoader({
  loadingText = "Your problems are being prepared",
  successText = "Ready!",
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
          {/* CODING STATE */}
          <div className="coder">
            <div className="head"></div>
            <div className="body"></div>
            <div className="laptop"></div>
            <div className="hands"></div>
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
