import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import CourseListPage from "./pages/CourseListPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseFormPage from "./pages/CourseFormPage";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

function HomeRedirect() {
  const { loading, isAuthenticated } = useContext(UserContext);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/courses" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            {/* Initial entry route: goes to login if not authenticated */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Courses protected for authenticated users */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CourseListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Routes */}
            <Route
              path="/my-enrollments"
              element={
                <ProtectedRoute role="Student">
                  <Navigate to="/courses" replace />
                </ProtectedRoute>
              }
            />

            {/* Teacher Protected Routes */}
            <Route
              path="/teacher/courses"
              element={
                <ProtectedRoute role="Teacher">
                  <Navigate to="/courses" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/new"
              element={
                <ProtectedRoute role="Teacher">
                  <CourseFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:id/edit"
              element={
                <ProtectedRoute role="Teacher">
                  <CourseFormPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Box>
      </Box>
    </HashRouter>
  );
}
