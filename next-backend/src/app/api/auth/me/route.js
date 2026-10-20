// src/app/api/auth/me/route.js

import { verifyJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse } from "@/lib/utils";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const userPayload = verifyJWT(request);
    if (!userPayload) {
      return errorResponse("Unauthorized", 401);
    }

    // Attempt to fetch fresh data from database if available
    try {
      const db = await getDatabase();
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(userPayload.id) },
        { projection: { password: 0 } },
      );

      if (user) {
        return successResponse({
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      }
    } catch {
      // Fallback to token payload if DB lookup fails
    }

    return successResponse({ user: userPayload });
  } catch (error) {
    return errorResponse("Failed to verify user session", 500);
  }
}
