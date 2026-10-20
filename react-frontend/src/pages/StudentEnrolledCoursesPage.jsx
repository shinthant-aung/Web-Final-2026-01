import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { courseApi } from "../services/api";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function StudentEnrolledCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEnrolled() {
      try {
        setLoading(true);
        setError("");
        const data = await courseApi.getEnrolledCourses();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load enrolled courses");
      } finally {
        setLoading(false);
      }
    }
    loadEnrolled();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        <BookmarkAddedIcon sx={{ fontSize: 36, color: "#0284c7" }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a" }}>
            My Enrolled Courses
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Courses you have registered for and are currently attending
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : courses.length === 0 ? (
        <Box
          textAlign="center"
          py={8}
          sx={{ backgroundColor: "#f8fafc", borderRadius: 3, border: "1px dashed #cbd5e1", px: 2 }}
        >
          <Typography variant="h6" color="text.secondary">
            You haven't enrolled in any courses yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Browse through the catalog and register for available open courses.
          </Typography>
          <Button
            component={RouterLink}
            to="/courses"
            variant="contained"
            sx={{
              backgroundColor: "#0284c7",
              "&:hover": { backgroundColor: "#0369a1" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Explore Courses
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Chip
                      label={course.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        backgroundColor:
                          course.status === "Open" ? "#dcfce7" : course.status === "Close" ? "#fef3c7" : "#fee2e2",
                        color:
                          course.status === "Open" ? "#15803d" : course.status === "Close" ? "#b45309" : "#b91c1c",
                      }}
                    />
                    <Chip
                      label="Enrolled"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#1e293b", mb: 1.5, lineHeight: 1.3 }}>
                    {course.name}
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={0.8} mb={2}>
                    <Box display="flex" alignItems="center" gap={1} sx={{ color: "#64748b" }}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">
                        Teacher: <strong>{course.teacherName}</strong>
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} sx={{ color: "#64748b" }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">{course.duration} days duration</Typography>
                    </Box>
                    {course.enrolledAt && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ color: "#64748b" }}>
                        <CalendarMonthIcon fontSize="small" />
                        <Typography variant="caption">
                          Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {course.topics?.map((topic, idx) => (
                        <Chip
                          key={idx}
                          label={topic}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem", borderRadius: 1 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    component={RouterLink}
                    to={`/courses/${course._id}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
