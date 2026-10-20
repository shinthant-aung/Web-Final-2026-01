import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { courseApi } from "../services/api";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GroupIcon from "@mui/icons-material/Group";

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, course: null });
  const [deleting, setDeleting] = useState(false);

  const fetchMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courseApi.getCourses({ mine: true });
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load your courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  const handleDelete = async () => {
    const course = deleteDialog.course;
    if (!course) return;

    try {
      setDeleting(true);
      setError("");
      setSuccessMsg("");
      await courseApi.deleteCourse(course._id);
      setSuccessMsg(`Course "${course.name}" was successfully deleted.`);
      setDeleteDialog({ open: false, course: null });
      fetchMyCourses();
    } catch (err) {
      setError(err.message || "Failed to delete course");
      setDeleteDialog({ open: false, course: null });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "Open":
        return <Chip label="Open" size="small" sx={{ backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />;
      case "Close":
        return <Chip label="Close" size="small" sx={{ backgroundColor: "#fef3c7", color: "#b45309", fontWeight: 700 }} />;
      case "Cancel":
        return <Chip label="Cancel" size="small" sx={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#0f172a" }}>
            Teacher Dashboard
          </Typography>
        </Box>

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
            px: 2.5,
            py: 1,
          }}
        >
          Create New Course
        </Button>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : courses.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            You haven't created any courses yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Get started by creating your first course and setting the topics, duration, and seat limits.
          </Typography>
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
            }}
          >
            Create Course
          </Button>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
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
              {courses.map((course) => {
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
                          <Chip key={i} label={topic} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
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
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, course: null })}>
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
          <Button onClick={() => setDeleteDialog({ open: false, course: null })} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting} sx={{ textTransform: "none" }}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
