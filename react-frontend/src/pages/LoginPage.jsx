import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoginPage() {
  const { user, login, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/courses", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      navigate("/courses");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <Box sx={{ backgroundColor: "#1e293b", py: 3, px: 4, textAlign: "center", color: "white" }}>
          <Typography variant="h5" fontWeight="bold">
            Sign In
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Access teacher course management or student enrollments
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="identifier"
              label="Username or Email"
              name="identifier"
              autoComplete="username"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: "#2563eb",
                "&:hover": { backgroundColor: "#1d4ed8" },
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
