import Navbar from "./components/Navbar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CampusListPage from "./pages/CampusListPage";
import YearsListPage from "./pages/YearsListPage";
import CompilerPage from "./pages/CompilerPage";
import CourseListPage from "./pages/CourseListPage";
import CategoryListPage from "./pages/CategoryListPage";
import QuestionListPage from "./pages/QuestionListPage";
import SolveQuestionPage from "./pages/SolveQuestionPage";
import QuestionUploadPage from "./pages/QuestionUploadPage";
import LoginPage from "./pages/LoginPage";
import CreateAdminPage from "./pages/CreateAdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import BatchListPage from "./pages/BatchListPage";
import SubmissionListPage from "./pages/SubmissionListPage";
import MCQListPage from "./pages/MCQListPage";
import MCQCreatePage from "./pages/MCQCreatePage";
import MCQStudentPage from "./pages/MCQStudentPage";
import MCQTestPage from "./pages/MCQTestPage";
import "./App.css";

export default function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";

  return (
    <>
      {hideNavbar ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Navbar />

          <main className="main-content">
            <Routes>
              {/* ✅ Compiler (Admin + Student) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["admin", "student"]}>
                    <CompilerPage />
                  </ProtectedRoute>
                }
              />

              {/* ✅ Practice (Admin + Student) */}
              <Route
                path="/courses"
                element={
                  <ProtectedRoute allowedRoles={["admin", "student"]}>
                    <CourseListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/courses/:courseId/categories"
                element={
                  <ProtectedRoute allowedRoles={["admin", "student"]}>
                    <CategoryListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/categories/:categoryId"
                element={
                  <ProtectedRoute allowedRoles={["admin", "student"]}>
                    <QuestionListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/questions/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin", "student"]}>
                    <SolveQuestionPage />
                  </ProtectedRoute>
                }
              />

              {/* 🔒 Admin Only */}
              <Route
                path="/admin/upload"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <QuestionUploadPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mcqs/test/:mcqId"
                element={
                  <ProtectedRoute>
                    <MCQTestPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/create"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CreateAdminPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/mcqs" element={
                <ProtectedRoute>
                  <MCQListPage />
                </ProtectedRoute>
              } />

              <Route path="/mcqs/create" element={
                <ProtectedRoute>
                  <MCQCreatePage />
                </ProtectedRoute>
              } />
              
              <Route path="/mcqs/student" element={
                <ProtectedRoute>
                  <MCQStudentPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/reports" element={<CampusListPage />} />
              <Route path="/years" element={<YearsListPage />} />
              <Route path="/submissions" element={<SubmissionListPage />} />
              <Route path="/batches" element={<BatchListPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      )}
    </>
  );
}
