import { useState, useEffect, useContext, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { courseApi } from "../services/api";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";

export default function CourseListPage() {
  const { isAuthenticated, isStudent, isTeacher } = useContext(UserContext);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  // User-specific courses: "My Course" for Teacher, "Enrolled Course" for Student
  const [userCourses, setUserCourses] = useState([]);
  const [loadingUserCourses, setLoadingUserCourses] = useState(false);

  // Delete dialog state for teachers
  const [deleteDialog, setDeleteDialog] = useState({ open: false, course: null });
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getCourses({ q: query });
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserCourses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingUserCourses(true);
      if (isTeacher) {
        const data = await courseApi.getCourses({ mine: true });
        setUserCourses(Array.isArray(data) ? data : []);
      } else if (isStudent) {
        const data = await courseApi.getEnrolledCourses();
        setUserCourses(Array.isArray(data) ? data : []);
      }
    } catch {
      setUserCourses([]);
    } finally {
      setLoadingUserCourses(false);
    }
  }, [isAuthenticated, isTeacher, isStudent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchCourses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserCourses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserCourses]);

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isStudent) {
      setToast({
        open: true,
        message: "Only students are eligible to enroll in courses.",
        severity: "warning",
      });
      return;
    }

    try {
      setEnrollingId(courseId);
      await courseApi.enrollCourse(courseId);
      setToast({
        open: true,
        message: "Enrollment successful! You have been enrolled in this course.",
        severity: "success",
      });
      fetchCourses(searchTerm);
      fetchUserCourses();
    } catch (err) {
      setToast({
        open: true,
        message: err.message || "Could not complete enrollment",
        severity: "error",
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteDialog.course) return;
    try {
      setDeleting(true);
      await courseApi.deleteCourse(deleteDialog.course._id);
      setToast({
        open: true,
        message: "Course deleted successfully.",
        severity: "success",
      });
      setDeleteDialog({ open: false, course: null });
      fetchUserCourses();
      fetchCourses(searchTerm);
    } catch (err) {
      setToast({
        open: true,
        message: err.message || "Failed to delete course.",
        severity: "error",
      });
      setDeleteDialog({ open: false, course: null });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "Open":
        return (
          <Chip
            label="Open"
            size="small"
            sx={{ backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      case "Close":
        return (
          <Chip
            label="Close"
            size="small"
            sx={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      case "Cancel":
        return (
          <Chip
            label="Cancel"
            size="small"
            sx={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* User Section: "My Course" table for Teacher, "Enrolled Course" table for Student */}
      {isAuthenticated && (isTeacher || isStudent) && (
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a" }}>
              {isTeacher ? "My Course" : "Enrolled Course"}
            </Typography>
            {isTeacher && (
              <Button
                component={RouterLink}
                to="/teacher/courses/new"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "#059669",
                  "&:hover": { backgroundColor: "#047857" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                }}
              >
                Create New Course
              </Button>
            )}
          </Box>

          {loadingUserCourses ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : userCourses.length === 0 ? (
            <Box
              sx={{
                p: 4,
                backgroundColor: "#f8fafc",
                borderRadius: 3,
                border: "1px dashed #cbd5e1",
                textAlign: "center",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {isTeacher
                  ? "You have not created any courses yet."
                  : "You have not enrolled in any courses yet."}
              </Typography>
            </Box>
          ) : isTeacher ? (
            /* Teacher Course Table (Matching Teacher Dashboard) */
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: "#1e293b" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Course Name</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Enrolled / Capacity</TableCell>
                    <TableCell align="right" sx={{ color: "#f8fafc", fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userCourses.map((course) => {
                    const enrolledCount = course.enrolledCount || 0;
                    const hasStudents = enrolledCount > 0;

                    return (
                      <TableRow key={course._id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="600" sx={{ color: "#1e293b" }}>
                            {course.name}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {course.topics?.slice(0, 3).map((topic, i) => (
                              <Chip
                                key={i}
                                label={topic}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            ))}
                            {course.topics?.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                                +{course.topics.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>{getStatusChip(course.status)}</TableCell>

                        <TableCell>{course.duration} days</TableCell>

                        <TableCell sx={{ fontWeight: 600, color: "#0284c7" }}>
                          {course.price > 0 ? `$${course.price}` : "Free"}
                        </TableCell>

                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <GroupIcon fontSize="small" sx={{ color: "#64748b" }} />
                            <Typography variant="body2" fontWeight="600">
                              {enrolledCount} / {course.maxStudents}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            <Tooltip title="View Details & Enrolled Students">
                              <IconButton
                                component={RouterLink}
                                to={`/courses/${course._id}`}
                                size="small"
                                sx={{ color: "#0284c7" }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Course">
                              <IconButton
                                component={RouterLink}
                                to={`/teacher/courses/${course._id}/edit`}
                                size="small"
                                sx={{ color: "#2563eb" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip
                              title={
                                hasStudents
                                  ? "Cannot delete: Students have already enrolled"
                                  : "Delete Course"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({ open: true, course })}
                                  disabled={hasStudents}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* Student Enrolled Course Table */
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: "#1e293b" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Course Name</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ color: "#f8fafc", fontWeight: 700 }}>Teacher</TableCell>
                    <TableCell align="right" sx={{ color: "#f8fafc", fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userCourses.map((course) => (
                    <TableRow key={course._id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="600" sx={{ color: "#1e293b" }}>
                          {course.name}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {course.topics?.slice(0, 3).map((topic, i) => (
                            <Chip
                              key={i}
                              label={topic}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem" }}
                            />
                          ))}
                        </Box>
                      </TableCell>

                      <TableCell>{getStatusChip(course.status)}</TableCell>

                      <TableCell>{course.duration} days</TableCell>

                      <TableCell sx={{ fontWeight: 600, color: "#0284c7" }}>
                        {course.price > 0 ? `$${course.price}` : "Free"}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{course.teacherName || "Instructor"}</Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            component={RouterLink}
                            to={`/courses/${course._id}`}
                            size="small"
                            sx={{ color: "#0284c7" }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider sx={{ my: 5 }} />
        </Box>
      )}

      {/* Course Catalog Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a" }}>
            Course Catalog
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mt: 0.5 }}>
            Explore available courses and enroll to start learning
          </Typography>
        </Box>

        {/* Search Bar: Filter by course name or teacher name */}
        <Box sx={{ width: { xs: "100%", sm: 360 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by course or teacher name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />
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
          sx={{ backgroundColor: "#f8fafc", borderRadius: 3, border: "1px dashed #cbd5e1" }}
        >
          <Typography variant="h6" color="text.secondary">
            No courses found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm
              ? `No results matching "${searchTerm}". Try another search term.`
              : "There are currently no active courses available."}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => {
            const isFull = (course.enrolledCount || 0) >= (course.maxStudents || 1);
            const isOpen = course.status === "Open";
            const isClose = course.status === "Close";
            const percentFilled = Math.min(
              100,
              Math.round(((course.enrolledCount || 0) / (course.maxStudents || 1)) * 100)
            );

            return (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Status & Price Row */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Chip
                        label={course.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          backgroundColor: isOpen ? "#dcfce7" : "#fef3c7",
                          color: isOpen ? "#15803d" : "#b45309",
                        }}
                      />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "#0284c7" }}>
                        {course.price > 0 ? `$${course.price}` : "Free"}
                      </Typography>
                    </Box>

                    {/* Course Title */}
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#1e293b", mb: 1, lineHeight: 1.3 }}>
                      {course.name}
                    </Typography>

                    {/* Teacher & Duration */}
                    <Box display="flex" flexDirection="column" gap={0.5} mb={2}>
                      <Box display="flex" alignItems="center" gap={0.8} sx={{ color: "#64748b" }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          Teacher: <strong>{course.teacherName || "Instructor"}</strong>
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.8} sx={{ color: "#64748b" }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{course.duration} days duration</Typography>
                      </Box>
                    </Box>

                    {/* Topics */}
                    <Box mb={2}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: "#94a3b8", display: "block", mb: 0.5 }}
                      >
                        TOPICS
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {course.topics && course.topics.length > 0 ? (
                          course.topics.map((topic, idx) => (
                            <Chip
                              key={idx}
                              label={topic}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem", borderRadius: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            General course
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Enrollment Capacity */}
                    <Box mt="auto" pt={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5} sx={{ color: "#475569" }}>
                          <GroupIcon fontSize="small" />
                          <Typography variant="caption" fontWeight="600">
                            Enrolled: {course.enrolledCount} / {course.maxStudents}
                          </Typography>
                        </Box>
                        {isFull && (
                          <Typography variant="caption" fontWeight="bold" sx={{ color: "#dc2626" }}>
                            FULL
                          </Typography>
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentFilled}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: isFull ? "#ef4444" : "#0284c7",
                          },
                        }}
                      />
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardActions sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
                    <Button
                      component={RouterLink}
                      to={`/courses/${course._id}`}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Details
                    </Button>

                    {isTeacher ? null : course.isEnrolled ? (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        disabled
                        startIcon={<CheckCircleIcon />}
                        sx={{
                          textTransform: "none",
                          backgroundColor: "#f1f5f9",
                          color: "#059669 !important",
                        }}
                      >
                        Enrolled
                      </Button>
                    ) : isClose ? (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        disabled
                        startIcon={<LockIcon />}
                        sx={{ textTransform: "none" }}
                      >
                        Closed
                      </Button>
                    ) : isFull ? (
                      <Button variant="contained" size="small" fullWidth disabled sx={{ textTransform: "none" }}>
                        Full
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingId === course._id}
                        sx={{
                          backgroundColor: "#0284c7",
                          "&:hover": { backgroundColor: "#0369a1" },
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        {enrollingId === course._id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Enroll"
                        )}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Delete Confirmation Dialog for Teacher */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, course: null })}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Delete Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.course?.name}</strong>?
          </DialogContentText>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, course: null })}
            disabled={deleting}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCourse}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ textTransform: "none" }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
