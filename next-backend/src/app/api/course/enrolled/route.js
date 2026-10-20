// src/app/api/course/enrolled/route.js

import { getDatabase } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * GET /api/course/enrolled
 * Exam Requirement: "Display the courses in which the Student is enrolled"
 */
export async function GET(request) {
  try {
    const currentUser = verifyJWT(request);
    if (!currentUser) {
      return errorResponse("Authentication required to view enrolled courses", 401);
    }

    if (currentUser.role !== "Student") {
      return errorResponse("Forbidden: Only students can view enrolled courses", 403);
    }

    const db = await getDatabase();
    const courses = await db
      .collection("courses")
      .find({ "enrolledStudents.studentId": currentUser.id })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = courses.map((course) => {
      const myEnrollment = course.enrolledStudents.find((s) => s.studentId === currentUser.id);
      return {
        _id: course._id.toString(),
        name: course.name,
        duration: course.duration,
        topics: course.topics || [],
        price: course.price,
        maxStudents: course.maxStudents,
        status: course.status,
        teacherId: course.teacherId,
        teacherName: course.teacherName,
        enrolledCount: course.enrolledStudents?.length || 0,
        enrolledAt: myEnrollment?.enrolledAt,
        isEnrolled: true,
      };
    });

    return successResponse(formatted);
  } catch (error) {
    printExceptionLog("Get Enrolled Courses", error);
    return errorResponse("Failed to fetch enrolled courses", 500);
  }
}
