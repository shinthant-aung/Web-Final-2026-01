// src/app/api/course/[course_id]/enroll/route.js

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * POST /api/course/[course_id]/enroll
 * Exam Requirements:
 * - Only authenticated Students can enroll.
 * - Enroll only when status is "Open".
 * - Enroll only when seats are still available (enrolled < maxStudents).
 * - A student cannot enroll in the same course more than once.
 */
export async function POST(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { course_id } = resolvedParams;

    if (!course_id || !ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const currentUser = verifyJWT(request);
    if (!currentUser) {
      return errorResponse("Authentication required to enroll in courses", 401);
    }

    if (currentUser.role !== "Student") {
      return errorResponse("Forbidden: Only students can enroll in courses", 403);
    }

    const db = await getDatabase();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    // Exam Rule: Status check
    if (course.status !== "Open") {
      return errorResponse(
        `Enrollment unavailable: This course status is '${course.status}'. Only 'Open' courses accept enrollments.`,
        400,
      );
    }

    const enrolledStudents = Array.isArray(course.enrolledStudents) ? course.enrolledStudents : [];

    // Exam Rule: Duplicate check
    const isAlreadyEnrolled = enrolledStudents.some(
      (s) => s.studentId === currentUser.id || s.studentId?.toString() === currentUser.id,
    );
    if (isAlreadyEnrolled) {
      return errorResponse("You are already enrolled in this course", 400);
    }

    // Exam Rule: Capacity check
    if (enrolledStudents.length >= course.maxStudents) {
      return errorResponse(
        `Course capacity reached: This course is full (${enrolledStudents.length}/${course.maxStudents} seats taken).`,
        400,
      );
    }

    const enrollmentRecord = {
      studentId: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      enrolledAt: new Date(),
    };

    // Atomic update to avoid race conditions
    const updateResult = await db.collection("courses").updateOne(
      {
        _id: new ObjectId(course_id),
        status: "Open",
        $expr: { $lt: [{ $size: { $ifNull: ["$enrolledStudents", []] } }, "$maxStudents"] },
        "enrolledStudents.studentId": { $ne: currentUser.id },
      },
      {
        $push: { enrolledStudents: enrollmentRecord },
        $set: { updatedAt: new Date() },
      },
    );

    if (updateResult.modifiedCount === 0) {
      // Re-fetch to give precise reason
      const currentCheck = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
      if (currentCheck.status !== "Open") {
        return errorResponse("Course status changed and is no longer Open", 400);
      }
      if ((currentCheck.enrolledStudents?.length || 0) >= currentCheck.maxStudents) {
        return errorResponse("Course just reached maximum capacity", 400);
      }
      if (currentCheck.enrolledStudents?.some((s) => s.studentId === currentUser.id)) {
        return errorResponse("You are already enrolled in this course", 400);
      }
      return errorResponse("Could not complete enrollment. Please try again.", 400);
    }

    return successResponse(
      {
        message: "Successfully enrolled in course",
        courseId: course_id,
        enrolledCount: enrolledStudents.length + 1,
      },
      200,
    );
  } catch (error) {
    printExceptionLog("Enroll in Course", error);
    return errorResponse("Failed to process enrollment", 500);
  }
}
