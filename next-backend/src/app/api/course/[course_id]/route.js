// src/app/api/course/[course_id]/route.js

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * GET /api/course/[course_id]
 * Displays course details.
 * If requested by course owner (Teacher): returns the list of enrolled students.
 * If requested by Student: respects Cancel status visibility and returns isEnrolled state.
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { course_id } = resolvedParams;

    if (!course_id || !ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    const currentUser = verifyJWT(request);
    const isOwner = currentUser && currentUser.role === "Teacher" && course.teacherId === currentUser.id;

    // Exam Requirement: Cancelled courses are not displayed to students
    if (course.status === "Cancel" && !isOwner) {
      return errorResponse("Course not available", 404);
    }

    const enrolledStudents = Array.isArray(course.enrolledStudents) ? course.enrolledStudents : [];
    const isEnrolled =
      currentUser && currentUser.role === "Student"
        ? enrolledStudents.some((s) => s.studentId === currentUser.id)
        : false;

    const responseData = {
      _id: course._id.toString(),
      name: course.name,
      duration: course.duration,
      topics: course.topics || [],
      price: course.price,
      maxStudents: course.maxStudents,
      status: course.status,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      enrolledCount: enrolledStudents.length,
      isEnrolled,
      // Exam Requirement: "The course details must also display the enrolled Students" for Teachers
      enrolledStudents: isOwner ? enrolledStudents : undefined,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    return successResponse(responseData);
  } catch (error) {
    printExceptionLog("Get Course Details", error);
    return errorResponse("Failed to fetch course details", 500);
  }
}

/**
 * PUT / PATCH /api/course/[course_id]
 * Exam Requirement: "Teachers can view and update only their own courses"
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { course_id } = resolvedParams;

    if (!course_id || !ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const currentUser = verifyJWT(request);
    if (!currentUser) {
      return errorResponse("Authentication required", 401);
    }

    if (currentUser.role !== "Teacher") {
      return errorResponse("Forbidden: Only teachers can update courses", 403);
    }

    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    // Ownership check
    if (course.teacherId !== currentUser.id) {
      return errorResponse("Forbidden: You can only update your own courses", 403);
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return errorResponse("Course name cannot be empty", 400);
      }
      updates.name = body.name.trim();
    }

    if (body.duration !== undefined) {
      const parsedDuration = Number(body.duration);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return errorResponse("Duration must be a positive number of days", 400);
      }
      updates.duration = parsedDuration;
    }

    if (body.price !== undefined) {
      const parsedPrice = Number(body.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return errorResponse("Price must be a non-negative number", 400);
      }
      updates.price = parsedPrice;
    }

    if (body.maxStudents !== undefined) {
      const parsedMaxStudents = Number(body.maxStudents);
      const currentEnrolled = course.enrolledStudents?.length || 0;
      if (isNaN(parsedMaxStudents) || parsedMaxStudents <= 0) {
        return errorResponse("Max students must be a positive number", 400);
      }
      if (parsedMaxStudents < currentEnrolled) {
        return errorResponse(
          `Max students (${parsedMaxStudents}) cannot be less than currently enrolled students (${currentEnrolled})`,
          400,
        );
      }
      updates.maxStudents = parsedMaxStudents;
    }

    if (body.status !== undefined) {
      const validStatuses = ["Open", "Close", "Cancel"];
      if (!validStatuses.includes(body.status)) {
        return errorResponse("Status must be one of: Open, Close, Cancel", 400);
      }
      updates.status = body.status;
    }

    if (body.topics !== undefined) {
      if (Array.isArray(body.topics)) {
        updates.topics = body.topics.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof body.topics === "string") {
        updates.topics = body.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    updates.updatedAt = new Date();

    await db.collection("courses").updateOne({ _id: new ObjectId(course_id) }, { $set: updates });

    const updatedCourse = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

    return successResponse({
      ...updatedCourse,
      _id: updatedCourse._id.toString(),
      enrolledCount: updatedCourse.enrolledStudents?.length || 0,
    });
  } catch (error) {
    printExceptionLog("Update Course", error);
    return errorResponse("Failed to update course", 500);
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

/**
 * DELETE /api/course/[course_id]
 * Exam Requirement: "Delete the Teacher's own course only when no Student has enrolled"
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { course_id } = resolvedParams;

    if (!course_id || !ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const currentUser = verifyJWT(request);
    if (!currentUser) {
      return errorResponse("Authentication required", 401);
    }

    if (currentUser.role !== "Teacher") {
      return errorResponse("Forbidden: Only teachers can delete courses", 403);
    }

    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    // Ownership check
    if (course.teacherId !== currentUser.id) {
      return errorResponse("Forbidden: You can only delete your own courses", 403);
    }

    // Business Rule Check: Cannot delete course if any students are enrolled
    const enrolledCount = course.enrolledStudents?.length || 0;
    if (enrolledCount > 0) {
      return errorResponse(
        `Cannot delete course: ${enrolledCount} student(s) have already enrolled in this course. Courses with enrolled students cannot be deleted.`,
        400,
      );
    }

    await db.collection("courses").deleteOne({ _id: new ObjectId(course_id) });

    return successResponse({ message: "Course deleted successfully" });
  } catch (error) {
    printExceptionLog("Delete Course", error);
    return errorResponse("Failed to delete course", 500);
  }
}
