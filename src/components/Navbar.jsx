import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaCode,
  FaList,
  FaUpload,
  FaUserShield,
  FaSignOutAlt,
  FaChartBar
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
      <div className="navbar-header">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">TSS Student's Hub</span>
      </div>

      <nav className="navbar-menu">
        {/* Compiler */}
        <Link to="/" className={`nav-item ${isActive("/")}`}>
          <FaCode />
          <span>Compiler</span>
        </Link>

        {/* Practice */}
        <Link to="/courses" className={`nav-item ${isActive("/courses")}`}>
          <FaList />
          <span>Practice</span>
        </Link>

        {/* 🔐 ADMIN ONLY */}
        {role === "admin" && (
          <>
            <Link
              to="/admin/upload"
              className={`nav-item ${isActive("/admin/upload")}`}
            >
              <FaUpload />
              <span>Upload Question</span>
            </Link>

            <Link
              to="/admin/create"
              className={`nav-item ${isActive("/admin/create")}`}
            >
              <FaUserShield />
              <span>Create Admin</span>
            </Link>

            {/* 📊 REPORTS */}
            <Link
              to="/admin/reports"
              className={`nav-item ${isActive("/admin/reports")}`}
            >
              <FaChartBar />
              <span>Reports</span>
            </Link>
          </>
        )}
      </nav>

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
