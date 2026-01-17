import { useEffect, useState } from "react";
import {
  ASSIGNMENT_DURATION_MS,
  getTimerKey,
  getRemainingTime
} from "../utils/assignmentTimer";

export default function AssignmentTimer({ assignmentId, onTimeUp }) {
  const [remaining, setRemaining] = useState(
    getRemainingTime(assignmentId)
  );

  useEffect(() => {
    // ⏱️ Start timer only once
    const key = getTimerKey(assignmentId);
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, Date.now());
    }

    const interval = setInterval(() => {
      const timeLeft = getRemainingTime(assignmentId);
      setRemaining(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        onTimeUp(); // 🚨 AUTO END TEST
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [assignmentId, onTimeUp]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="assignment-timer">
      ⏳ Time Left:{" "}
      <strong>
        {String(mins).padStart(2, "0")}:
        {String(secs).padStart(2, "0")}
      </strong>
    </div>
  );
}
