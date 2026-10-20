import { useContext } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

export default function Navbar() {
  const { user, isAuthenticated, isTeacher, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/login" || !isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "flex-end", px: { xs: 2, md: 4 } }}>
        {/* User Account Section on the Right */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isAuthenticated ? (
            <>
              <Chip
                label={user?.role}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  backgroundColor: isTeacher ? "#065f46" : "#1e40af",
                  color: isTeacher ? "#a7f3d0" : "#bfdbfe",
                }}
              />
              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                size="small"
                variant="outlined"
                sx={{
                  ml: 1,
                  color: "#f87171",
                  borderColor: "#f87171",
                  textTransform: "none",
                  "&:hover": { borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<LoginIcon />}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "#2563eb",
                "&:hover": { backgroundColor: "#1d4ed8" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
