import { useEffect, useState, useCallback } from "react";
import {
  FaRegCalendarAlt,
  FaPlay,
  FaEye,
  FaClock,
  FaUpload,
  FaSpinner
} from "react-icons/fa";
import "./StudentTaskTracker.css";

const API = process.env.REACT_APP_API_BASE_URL;

// 🔐 SAFE CLOUDINARY CONFIG (NO SECRET)
const CLOUD_NAME = "dmdzi18ww";
const UPLOAD_PRESET = "tssplatformtasksubmission";

export default function StudentTaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [proofImages, setProofImages] = useState([]);

  const userId = localStorage.getItem("userId");

  /* ================= LOAD TASKS ================= */
  const loadTasks = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/user/getTasksForStudent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    setTasks(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const isOverdue = (date) =>
    new Date(date).setHours(0, 0, 0, 0) <
    new Date().setHours(0, 0, 0, 0);

  /* ================= START TASK ================= */
  const handleStartTask = async (task) => {
    await fetch(`${API}/api/task/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: userId, taskId: task._id })
    });

    setSelectedTask(task);
  };

  /* ================= UPLOAD TO CLOUDINARY ================= */
  const uploadProofImages = async (files) => {
    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: form
        }
      );

      const data = await res.json();
      uploaded.push({ url: data.secure_url });
    }

    setUploading(false);
    return uploaded;
  };

  /* ================= COMPLETE TASK ================= */
  const handleCompleteTask = async () => {
    await fetch(`${API}/api/task/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: userId,
        taskId: selectedTask._id,
        proof: proofImages
      })
    });

    setSelectedTask(null);
    setProofImages([]);
    loadTasks();
  };

  return (
    <div className="student-task-page">
      <div className="student-header">
        <h2>📋 My Tasks</h2>
        <p>Track and complete your assigned tasks</p>
      </div>

      {loading ? (
        <div className="loading">Loading tasks…</div>
      ) : (
        <div className="task-table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task, i) => (
                <tr key={task._id}>
                  <td>{i + 1}</td>
                  <td>{task.title}</td>

                  <td>
                    <FaRegCalendarAlt />{" "}
                    {new Date(task.dueDate).toDateString()}
                  </td>

                  <td>
                    {isOverdue(task.dueDate) ? (
                      <span className="status overdue">
                        <FaClock /> Overdue
                      </span>
                    ) : (
                      <span className="status active">Active</span>
                    )}
                  </td>

                  <td className="actions-cell">
                    <div className="actions-wrapper">
                      <button
                        className="view-btn"
                        onClick={() => setSelectedTask(task)}
                      >
                        <FaEye /> View
                      </button>

                      <button
                        className="start-btn"
                        onClick={() => handleStartTask(task)}
                      >
                        <FaPlay /> Start
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {selectedTask && (
        <div className="task-modal-backdrop">
          <div className="task-modal">
            <h3>{selectedTask.title}</h3>

            <p>{selectedTask.description}</p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={async (e) => {
                const uploaded = await uploadProofImages(e.target.files);
                setProofImages(uploaded);
              }}
            />

            {uploading && (
              <div className="uploading">
                <FaSpinner className="spin" /> Uploading…
              </div>
            )}

            <button
              className="complete-btn"
              disabled={uploading || proofImages.length === 0}
              onClick={handleCompleteTask}
            >
              <FaUpload /> Submit & Complete
            </button>

            <button
              className="task-close-btn"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
