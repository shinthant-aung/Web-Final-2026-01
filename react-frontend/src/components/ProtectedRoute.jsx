import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useContext(UserContext);

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

  if (role && user?.role !== role) {
    return <Navigate to="/courses" replace />;
  }

  return children;
}
