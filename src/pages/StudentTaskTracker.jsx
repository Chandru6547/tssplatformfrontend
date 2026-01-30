import { useEffect, useState, useCallback, useMemo } from "react";
import swal from "sweetalert";
import StudentTaskDashboard from "./StudentTaskDashboard";
import StudentTaskCharts from "./StudentTaskCharts";
import {
  FaRegCalendarAlt,
  FaPlay,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
  FaEye
} from "react-icons/fa";
import "./StudentTaskTracker.css";

const API = process.env.REACT_APP_API_BASE_URL;
const CLOUD_NAME = "dmdzi18ww";
const UPLOAD_PRESET = "tssplatformtasksubmission";

export default function StudentTaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImages, setProofImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [taskStatusMap, setTaskStatusMap] = useState({});
  const [filter, setFilter] = useState("all"); // 👈 dashboard filter

  const studentId = localStorage.getItem("userId");

  /* ================= LOAD TASKS ================= */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/user/getTasksForStudent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: studentId })
      });
      const data = await res.json();
      setTasks(data || []);
    } catch {
      swal("Error", "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  /* ================= LOAD STATUS PER TASK ================= */
  const loadTaskStatus = useCallback(
    async (taskId) => {
      const res = await fetch(
        `${API}/api/taskSubmission/getSubmissionByStudentAndTask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, taskId })
        }
      );
      const data = await res.json();
      return data[0]?.taskStatus || "not_started";
    },
    [studentId]
  );

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /* ================= FETCH STATUS AFTER TASK LOAD ================= */
  useEffect(() => {
    if (!tasks.length) return;

    (async () => {
      const statusObj = {};
      for (const task of tasks) {
        statusObj[task._id] = await loadTaskStatus(task._id);
      }
      setTaskStatusMap(statusObj);
    })();
  }, [tasks, loadTaskStatus]);

  /* ================= START TASK ================= */
  const startTask = async (task) => {
    try {
      const res = await fetch(`${API}/api/task/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, taskId: task._id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      swal("Started!", "Task started successfully", "success");

      setTaskStatusMap((prev) => ({
        ...prev,
        [task._id]: "started"
      }));
    } catch (err) {
      swal("Error", err.message, "error");
    }
  };

  /* ================= CLOUDINARY UPLOAD ================= */
  const uploadProofImages = async (files) => {
    setUploading(true);
    const uploaded = [];

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: form }
        );
        const data = await res.json();
        uploaded.push({ url: data.secure_url });
      }
      setProofImages(uploaded);
    } catch {
      swal("Error", "Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ================= COMPLETE TASK ================= */
  const completeTask = async () => {
    try {
      const res = await fetch(`${API}/api/task/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: selectedTask._id,
          proof: proofImages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      swal("Completed!", "Task submitted successfully", "success");

      setTaskStatusMap((prev) => ({
        ...prev,
        [selectedTask._id]: "completed"
      }));

      setSelectedTask(null);
      setProofImages([]);
    } catch (err) {
      swal("Error", err.message, "error");
    }
  };

  /* ================= FILTERED TASKS ================= */
  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter(
      (task) => taskStatusMap[task._id] === filter
    );
  }, [tasks, taskStatusMap, filter]);

  /* ================= STATUS UI ================= */
  const renderStatus = (taskId) => {
    const status = taskStatusMap[taskId];
    if (status === "started")
      return <span className="status inprogress">IN PROGRESS</span>;
    if (status === "completed")
      return <span className="status completed">COMPLETED</span>;
    return <span className="status notstarted">NOT STARTED</span>;
  };

  /* ================= ACTION BUTTONS ================= */
  const renderAction = (task) => {
    const status = taskStatusMap[task._id];

    return (
      <div className="action-buttons">
        <button className="btn view" onClick={() => setSelectedTask(task)}>
          <FaEye /> View
        </button>

        {status === "not_started" && (
          <button className="btn start" onClick={() => startTask(task)}>
            <FaPlay /> Start
          </button>
        )}

        {status === "started" && (
          <button
            className="btn complete"
            onClick={() => setSelectedTask(task)}
          >
            <FaCheckCircle /> Complete
          </button>
        )}

        {status === "completed" && (
          <button className="btn done" disabled>
            ✔ Completed
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="student-task-page">
      <div className="student-header">
        <h2>My Assigned Tasks</h2>
        <p>Track, complete, and submit your assigned work</p>
    </div>


      {/* ===== DASHBOARD (CLICK TO FILTER) ===== */}
      <StudentTaskDashboard
        tasks={tasks}
        taskStatusMap={taskStatusMap}
        onFilter={setFilter}
      />

      {/* ===== CHARTS ===== */}
      <StudentTaskCharts taskStatusMap={taskStatusMap} />

      {loading ? (
        <div className="loading">
          <FaSpinner className="spin" /> Loading...
        </div>
      ) : (
        <div className="task-table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, i) => (
                <tr key={task._id}>
                  <td>{i + 1}</td>
                  <td>{task.title}</td>
                  <td>
                    <td className={
                        new Date(task.dueDate) < new Date() &&
                        taskStatusMap[task._id] !== "completed"
                            ? "due overdue"
                            : "due"
                        }>
                        <FaRegCalendarAlt />
                        {new Date(task.dueDate).toDateString()}
                        </td>
                  </td>
                  <td>{renderStatus(task._id)}</td>
                  <td>{renderAction(task)}</td>
                </tr>
              ))}

              {!filteredTasks.length && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== VIEW / COMPLETE MODAL ===== */}
      {selectedTask && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedTask.title}</h3>
              <FaTimes onClick={() => setSelectedTask(null)} />
            </div>

            <div className="modal-body">
              <p>{selectedTask.description}</p>

              {taskStatusMap[selectedTask._id] === "started" && (
                <>
                  <label className="upload-box">
                    <FaUpload /> Upload Proof
                    <input
                      type="file"
                      multiple
                      onChange={(e) => uploadProofImages(e.target.files)}
                    />
                  </label>

                  {uploading && <p>Uploading...</p>}

                  <div className="preview-grid">
                    {proofImages.map((p, i) => (
                      <img key={i} src={p.url} alt="proof" />
                    ))}
                  </div>
                </>
              )}
            </div>

            {taskStatusMap[selectedTask._id] === "started" && (
              <div className="modal-footer">
                <button
                  className="btn submit"
                  disabled={!proofImages.length}
                  onClick={completeTask}
                >
                  Submit Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
