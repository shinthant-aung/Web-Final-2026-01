import { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { courseApi } from "../services/api";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isTeacher, isStudent } = useContext(UserContext);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getCourse(id);
      setCourse(data);
    } catch (err) {
      setError(err.message || "Course not found or access denied");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourse();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCourse]);

  const isOwner = isTeacher && course?.teacherId === user?.id;
  const isFull = (course?.enrolledCount || 0) >= (course?.maxStudents || 1);
  const isClose = course?.status === "Close";

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isStudent) {
      setActionError("Only students can enroll in courses.");
      return;
    }

    try {
      setEnrolling(true);
      setActionError("");
      setActionSuccess("");
      await courseApi.enrollCourse(id);
      setActionSuccess("Successfully enrolled in this course!");
      fetchCourse();
    } catch (err) {
      setActionError(err.message || "Failed to enroll in this course.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setActionError("");
      await courseApi.deleteCourse(id);
      setDeleteDialogOpen(false);
      navigate("/courses");
    } catch (err) {
      setActionError(err.message || "Failed to delete course.");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={12}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Course not found"}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/courses" variant="outlined">
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, textTransform: "none", color: "#64748b" }}
      >
        Back
      </Button>

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}

      {/* Main Course Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", mb: 4, overflow: "hidden" }}>
        <Box sx={{ backgroundColor: "#1e293b", p: 4, color: "white" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              {isOwner && (
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label="Your Course"
                    size="small"
                    sx={{ backgroundColor: "#047857", color: "#a7f3d0", fontWeight: 600 }}
                  />
                </Box>
              )}
              <Typography variant="h4" fontWeight="bold">
                {course.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: "#94a3b8", mt: 0.5 }}>
                Instructor: <strong>{course.teacherName}</strong>
              </Typography>
            </Box>

            {/* Teacher Owner Controls */}
            {isOwner && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Button
                  component={RouterLink}
                  to={`/teacher/courses/${course._id}/edit`}
                  variant="contained"
                  startIcon={<EditIcon />}
                  size="small"
                  sx={{ backgroundColor: "#3b82f6", "&:hover": { backgroundColor: "#2563eb" }, textTransform: "none" }}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setDeleteDialogOpen(true)}
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon />}
                  size="small"
                  color="error"
                  sx={{ textTransform: "none" }}
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Course Topics */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, color: "#1e293b" }}>
            Course Topics
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
            {course.topics && course.topics.length > 0 ? (
              course.topics.map((topic, i) => (
                <Chip key={i} label={topic} variant="outlined" sx={{ fontWeight: 500 }} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No specific topics listed.
              </Typography>
            )}
          </Box>

          {/* Information */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#1e293b" }}>
            Information
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <InfoOutlinedIcon color="action" />
              <Typography variant="body1">
                Status: <strong>{course.status}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AccessTimeIcon color="action" />
              <Typography variant="body1">
                Duration: <strong>{course.duration} days</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <MonetizationOnIcon color="action" />
              <Typography variant="body1">
                Price: <strong>{course.price > 0 ? `$${course.price}` : "Free"}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <PersonIcon color="action" />
              <Typography variant="body1">
                Teacher: <strong>{course.teacherName}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <GroupIcon color="action" />
              <Typography variant="body1">
                Enrollment: <strong>{course.enrolledCount} / {course.maxStudents} Students</strong>
                {isFull && (
                  <Typography component="span" sx={{ color: "#dc2626", fontWeight: "bold", ml: 1 }}>
                    (Full)
                  </Typography>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Student Enrollment Action */}
          {isStudent && (
            <Box sx={{ mt: 3, maxWidth: 260 }}>
              {course.isEnrolled ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    backgroundColor: "#ecfdf5 !important",
                    color: "#059669 !important",
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  You are Enrolled
                </Button>
              ) : isClose ? (
                <Button fullWidth variant="contained" disabled sx={{ py: 1.2, textTransform: "none" }}>
                  Course Closed
                </Button>
              ) : isFull ? (
                <Button fullWidth variant="contained" disabled sx={{ py: 1.2, textTransform: "none" }}>
                  Course Full
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  sx={{
                    backgroundColor: "#0284c7",
                    "&:hover": { backgroundColor: "#0369a1" },
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {enrolling ? <CircularProgress size={24} color="inherit" /> : "Enroll in this Course"}
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Teacher Function: "The course details must also display the enrolled Students" */}
      {isOwner && (
        <Box sx={{ mt: 5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <GroupIcon sx={{ color: "#059669", fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: "#1e293b" }}>
              Enrolled Students ({course.enrolledStudents?.length || 0})
            </Typography>
          </Box>

          {!course.enrolledStudents || course.enrolledStudents.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, backgroundColor: "#f8fafc" }}>
              <Typography variant="body1" color="text.secondary">
                No students have enrolled in this course yet.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Note: You can safely edit or delete this course as long as no students have enrolled.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Enrolled Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {course.enrolledStudents.map((student, idx) => (
                    <TableRow key={student.studentId || idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{student.username}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Delete Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{course.name}</strong>?
          </DialogContentText>
          {course.enrolledCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Warning: <strong>{course.enrolledCount} student(s)</strong> are enrolled in this course.
              Under examination rules, courses with active enrollments cannot be deleted!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting || course.enrolledCount > 0}
            sx={{ textTransform: "none" }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
