import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaCode,
  FaBookOpen,
  FaListAlt,
  FaRobot,
  FaFileAlt,
  FaCalendarCheck,
  FaMedal,
  FaClipboardList,
  FaClipboardCheck,
  FaPlusCircle,
  FaCloudUploadAlt,
  FaChartPie,
  FaSignOutAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaProjectDiagram,
  FaUsers,
  FaHeadset,
  // FaUserClock,
  FaInbox,
  FaBookReader,
  FaLayerGroup,
  FaChartBar,
  FaGraduationCap
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
        <FaGraduationCap className="logo-icon" />
        <span className="logo-text">
          ⚡ TSS Student&apos;s Hub
        </span>
      </div>

      {/* ---------- MENU ---------- */}
      <nav className="navbar-menu">
        {/* ================= STAFF ================= */}
        {role === "staff" && (
          <Link
            to="/select-assessment"
            className={`nav-item ${isActive("/select-assessment")}`}
          >
            <FaChartBar />
            <span>View Report</span>
          </Link>
        )}

        {/* ================= STUDENT ================= */}
        {role === "student" && (
          <>
            <Link to="/" className={`nav-item ${isActive("/")}`}>
              <FaCode />
              <span>IDE</span>
            </Link>

            <Link to="/courses" className={`nav-item ${isActive("/courses")}`}>
              <FaBookOpen />
              <span>Practice</span>
            </Link>

            <Link
              to="/mcqs/student"
              className={`nav-item ${isActive("/mcqs")}`}
            >
              <FaListAlt />
              <span>MCQs</span>
            </Link>

            <Link
              to="/view-mcqs-answer"
              className={`nav-item ${isActive("/view-mcqs-answer")}`}
            >
              <FaClipboardCheck />
              <span>View MCQs Answer</span>
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
              <FaCalendarCheck />
              <span>Meeting Scheduler</span>
            </Link>

            <Link to="/comingsoon" className="nav-item">
              <FaMedal />
              <span>Contest</span>
            </Link>

            <Link
              to="/assignment-student"
              className={`nav-item ${isActive("/assignment-student")}`}
            >
              <FaClipboardList />
              <span>Assignments</span>
            </Link>

            <Link
              to="/raise-ticket"
              className={`nav-item ${isActive("/raise-ticket")}`}
            >
              <FaHeadset />
              <span>Raise a Ticket</span>
            </Link>

           <Link
              to="/student-tracker"
              className={`nav-item ${isActive("/student-tracker")}`}
            >
              <FaHeadset />
              <span>Student Tracker</span>
            </Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {role === "admin" && (
          <>
            <Link to="/" className={`nav-item ${isActive("/")}`}>
              <FaCode />
              <span>IDE</span>
            </Link>

            <Link to="/courses" className={`nav-item ${isActive("/courses")}`}>
              <FaBookOpen />
              <span>Practice</span>
            </Link>

            <Link to="/mcqs" className={`nav-item ${isActive("/mcqs")}`}>
              <FaListAlt />
              <span>MCQs</span>
            </Link>

            <Link
              to="/mcqs/create"
              className={`nav-item ${isActive("/mcqs/create")}`}
            >
              <FaPlusCircle />
              <span>Create MCQ</span>
            </Link>

            <Link
              to="/admin/upload"
              className={`nav-item ${isActive("/admin/upload")}`}
            >
              <FaCloudUploadAlt />
              <span>Upload Question</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`nav-item ${isActive("/admin/reports")}`}
            >
              <FaChartPie />
              <span>Reports</span>
            </Link>

            <Link
              to="/create-student"
              className={`nav-item ${isActive("/create-student")}`}
            >
              <FaUserGraduate />
              <span>Student Creation</span>
            </Link>

            <Link
              to="/create-staff"
              className={`nav-item ${isActive("/create-staff")}`}
            >
              <FaChalkboardTeacher />
              <span>Create Staff</span>
            </Link>

            <Link
              to="/manage-curriculam"
              className={`nav-item ${isActive("/manage-curriculam")}`}
            >
              <FaProjectDiagram />
              <span>Manage Curriculum</span>
            </Link>

            <Link
              to="/assignments/create"
              className={`nav-item ${isActive("/assignments/create")}`}
            >
              <FaClipboardList />
              <span>Create Assignments</span>
            </Link>

            <Link
              to="/assignments/viewall"
              className={`nav-item ${isActive("/assignments/viewall")}`}
            >
              <FaClipboardCheck />
              <span>View Assignments</span>
            </Link>

            <Link
              to="/view-students-campus"
              className={`nav-item ${isActive("/view-students-campus")}`}
            >
              <FaUsers />
              <span>View Students</span>
            </Link>

            <Link
              to="/view-all-tickets"
              className={`nav-item ${isActive("/view-all-tickets")}`}
            >
              <FaInbox />
              <span>View Tickets</span>
            </Link>

            <Link
              to="/tss-library-dashboard"
              className={`nav-item ${isActive("/tss-library-dashboard")}`}
            >
              <FaBookReader />
              <span>TSS Library</span>
            </Link>

            <Link
              to="/tss-curriculum-dashboard"
              className={`nav-item ${isActive("/tss-curriculum-dashboard")}`}
            >
              <FaLayerGroup />
              <span>TSS Curriculum</span>
            </Link>
            <Link
              to="/tss-tracker"
              className={`nav-item ${isActive("/tss-tracker")}`}
            >
              <FaLayerGroup />
              <span>TSS Tracker</span>
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
