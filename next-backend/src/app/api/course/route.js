// src/app/api/course/route.js

import { getDatabase } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

/**
 * GET /api/course
 * Query params:
 * - mine=true: for authenticated Teacher to view their own courses (including Cancel status)
 * - enrolled=true: for authenticated Student to view their enrolled courses
 * - q or search: filter courses by partial course name or Teacher name
 *
 * Default (Student / Public catalog):
 * - Hides courses with "Cancel" status
 * - Supports partial matching on course name or teacher name
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const enrolled = searchParams.get("enrolled") === "true";
    const query = (searchParams.get("q") || searchParams.get("search") || "").trim();

    const currentUser = verifyJWT(request);
    const db = await getDatabase();
    let filter = {};

    if (mine) {
      if (!currentUser) {
        return errorResponse("Authentication required to view your courses", 401);
      }
      if (currentUser.role !== "Teacher") {
        return errorResponse("Only teachers can view teacher course listings", 403);
      }
      filter.teacherId = currentUser.id;
    } else if (enrolled) {
      if (!currentUser) {
        return errorResponse("Authentication required to view enrolled courses", 401);
      }
      if (currentUser.role !== "Student") {
        return errorResponse("Only students can view enrolled courses", 403);
      }
      filter["enrolledStudents.studentId"] = currentUser.id;
    } else {
      // General course list (Students/Public)
      // Exam Requirement: "Display all courses except courses with Cancel status"
      filter.status = { $ne: "Cancel" };

      // Exam Requirement: "Filter courses by part of the course name or Teacher name"
      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: "i" } },
          { teacherName: { $regex: query, $options: "i" } },
        ];
      }
    }

    const courses = await db.collection("courses").find(filter).sort({ createdAt: -1 }).toArray();

    // Sanitize and format courses based on caller role
    const sanitizedCourses = courses.map((course) => {
      const isOwner = currentUser && currentUser.role === "Teacher" && course.teacherId === currentUser.id;
      const enrolledCount = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0;
      const isEnrolled =
        currentUser && currentUser.role === "Student" && Array.isArray(course.enrolledStudents)
          ? course.enrolledStudents.some((s) => s.studentId === currentUser.id)
          : false;

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
        enrolledCount,
        isEnrolled,
        // Only course owner gets the full enrolled students roster
        enrolledStudents: isOwner ? course.enrolledStudents || [] : undefined,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    });

    return successResponse(sanitizedCourses);
  } catch (error) {
    printExceptionLog("Get Courses", error);
    return errorResponse("Failed to fetch courses", 500);
  }
}

/**
 * POST /api/course
 * Exam Requirement: "Only authenticated Teachers can create courses"
 */
export async function POST(request) {
  try {
    const currentUser = verifyJWT(request);
    if (!currentUser) {
      return errorResponse("Authentication required", 401);
    }

    if (currentUser.role !== "Teacher") {
      return errorResponse("Forbidden: Only teachers can create courses", 403);
    }

    const body = await request.json().catch(() => ({}));
    const { name, duration, topics, price, maxStudents, status } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return errorResponse("Course name is required", 400);
    }

    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return errorResponse("Duration must be a positive number of days", 400);
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return errorResponse("Price must be a non-negative number", 400);
    }

    const parsedMaxStudents = Number(maxStudents);
    if (isNaN(parsedMaxStudents) || parsedMaxStudents <= 0) {
      return errorResponse("Max students must be a positive number", 400);
    }

    const validStatuses = ["Open", "Close", "Cancel"];
    const courseStatus = validStatuses.includes(status) ? status : "Open";

    let topicsArray = [];
    if (Array.isArray(topics)) {
      topicsArray = topics.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof topics === "string") {
      topicsArray = topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const newCourse = {
      name: name.trim(),
      duration: parsedDuration,
      topics: topicsArray,
      price: parsedPrice,
      maxStudents: parsedMaxStudents,
      status: courseStatus,
      teacherId: currentUser.id,
      teacherName: currentUser.username,
      enrolledStudents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db.collection("courses").insertOne(newCourse);

    return successResponse(
      {
        ...newCourse,
        _id: result.insertedId.toString(),
        enrolledCount: 0,
      },
      201,
    );
  } catch (error) {
    printExceptionLog("Create Course", error);
    return errorResponse("Failed to create course", 500);
  }
}
