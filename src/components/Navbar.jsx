import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaCode,
  FaBookOpen,
  FaQuestionCircle,
  FaRobot,
  FaFileAlt,
  FaCalendarAlt,
  FaTrophy,
  FaTasks,
  FaPlusSquare,
  FaUpload,
  FaChartLine,
  FaSignOutAlt
} from "react-icons/fa";

import { logout, isAuthenticated, getRole } from "../utils/auth";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname.startsWith(path) ? "active" : "";

  return (
    <aside className="navbar">
      {/* ---------- HEADER ---------- */}
      <div className="navbar-header">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">TSS Student&apos;s Hub</span>
      </div>

      {/* ---------- MENU ---------- */}
      <nav className="navbar-menu">
        {/* Compiler */}
        <Link to="/" className={`nav-item ${isActive("/")}`}>
          <FaCode />
          <span>IDE</span>
        </Link>

        {/* Practice */}
        <Link to="/courses" className={`nav-item ${isActive("/courses")}`}>
          <FaBookOpen />
          <span>Practice</span>
        </Link>

        {/* ================= STUDENT ================= */}
        {role === "student" && (
          <>
            <Link
              to="/mcqs/student"
              className={`nav-item ${isActive("/mcqs")}`}
            >
              <FaQuestionCircle />
              <span>MCQs</span>
            </Link>

            <Link to="/comingsoon" className="nav-item">
              <FaRobot />
              <span>AI Interview</span>
            </Link>

            <Link to="/comingsoon" className="nav-item">
              <FaFileAlt />
              <span>AI Resume</span>
            </Link>

            <Link to="/comingsoon" className="nav-item">
              <FaCalendarAlt />
              <span>Meeting Scheduler</span>
            </Link>

            <Link to="/comingsoon" className="nav-item">
              <FaTrophy />
              <span>Contest</span>
            </Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {role === "admin" && (
          <>
            <Link to="/mcqs" className={`nav-item ${isActive("/mcqs")}`}>
              <FaTasks />
              <span>MCQs</span>
            </Link>

            <Link
              to="/mcqs/create"
              className={`nav-item ${isActive("/mcqs/create")}`}
            >
              <FaPlusSquare />
              <span>Create MCQ</span>
            </Link>

            <Link
              to="/admin/upload"
              className={`nav-item ${isActive("/admin/upload")}`}
            >
              <FaUpload />
              <span>Upload Question</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`nav-item ${isActive("/admin/reports")}`}
            >
              <FaChartLine />
              <span>Reports</span>
            </Link>
            <Link
              to="/create-student"
              className={`nav-item ${isActive("/create-student")}`}
            >
              <FaChartLine />
              <span>Student Creation</span>
            </Link>
          </>
        )}
      </nav>

      {/* ---------- FOOTER ---------- */}
      <div className="navbar-footer">
        {isAuthenticated() && (
          <button className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
