import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { courseApi } from "../services/api";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Close", label: "Close" },
  { value: "Cancel", label: "Cancel" },
];

export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    topics: "",
    price: "0",
    maxStudents: "30",
    status: "Open",
  });

  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentEnrolled, setCurrentEnrolled] = useState(0);

  const fetchCourseData = useCallback(async () => {
    if (!id) return;
    try {
      setInitialLoading(true);
      setError("");
      const course = await courseApi.getCourse(id);
      setFormData({
        name: course.name || "",
        duration: course.duration?.toString() || "",
        topics: Array.isArray(course.topics) ? course.topics.join(", ") : course.topics || "",
        price: course.price?.toString() || "0",
        maxStudents: course.maxStudents?.toString() || "30",
        status: course.status || "Open",
      });
      setCurrentEnrolled(course.enrolledCount || course.enrolledStudents?.length || 0);
    } catch (err) {
      setError(err.message || "Failed to load course details");
    } finally {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchCourseData();
    }
  }, [isEditMode, fetchCourseData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Course name is required");
      return;
    }

    const durationNum = Number(formData.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError("Duration must be a positive number of days");
      return;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a valid non-negative number");
      return;
    }

    const maxStudentsNum = Number(formData.maxStudents);
    if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
      setError("Max students must be a positive number");
      return;
    }

    if (isEditMode && maxStudentsNum < currentEnrolled) {
      setError(`Max students cannot be less than currently enrolled students (${currentEnrolled})`);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      duration: durationNum,
      topics: formData.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      price: priceNum,
      maxStudents: maxStudentsNum,
      status: formData.status,
    };

    try {
      setSubmitting(true);
      if (isEditMode) {
        await courseApi.updateCourse(id, payload);
      } else {
        await courseApi.createCourse(payload);
      }
      navigate("/courses");
    } catch (err) {
      setError(err.message || "Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" py={12}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/courses"
        sx={{ mb: 3, textTransform: "none", color: "#64748b" }}
      >
        Back to Courses
      </Button>

      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <Box sx={{ backgroundColor: "#1e293b", p: 3, color: "white" }}>
          <Typography variant="h5" fontWeight="bold">
            {isEditMode ? "Edit Course" : "Create New Course"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            {isEditMode
              ? "Update your course information, status, and enrollment capacity"
              : "Fill out the course parameters and initial status to publish to students"}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isEditMode && currentEnrolled > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This course currently has <strong>{currentEnrolled} enrolled student(s)</strong>.
              Max students cannot be reduced below {currentEnrolled}.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              {/* Course Name */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  name="name"
                  label="Course Name"
                  placeholder="e.g. Modern Full-Stack Web Development"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </Grid>

              {/* Duration & Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  id="duration"
                  name="duration"
                  label="Duration (in days)"
                  placeholder="e.g. 30"
                  inputProps={{ min: 1 }}
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  id="price"
                  name="price"
                  label="Price (THB)"
                  placeholder="0 for free"
                  inputProps={{ min: 0, step: "any" }}
                  value={formData.price}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </Grid>

              {/* Max Students & Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  label="Max Students Capacity"
                  placeholder="e.g. 50"
                  inputProps={{ min: isEditMode ? Math.max(1, currentEnrolled) : 1 }}
                  value={formData.maxStudents}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText={
                    isEditMode && currentEnrolled > 0
                      ? `Minimum ${currentEnrolled} required due to existing enrollments`
                      : "Maximum allowed student enrollments"
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  id="status"
                  name="status"
                  label="Status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Topics */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="topics"
                  name="topics"
                  label="Topics"
                  placeholder="e.g. Next.js, React, MongoDB, REST API, JWT"
                  value={formData.topics}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12} sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/courses"
                  variant="outlined"
                  disabled={submitting}
                  sx={{ textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={submitting}
                  sx={{
                    backgroundColor: "#059669",
                    "&:hover": { backgroundColor: "#047857" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  {submitting ? "Saving..." : isEditMode ? "Update Course" : "Create Course"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
