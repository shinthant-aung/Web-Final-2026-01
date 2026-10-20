// src/app/api/auth/login/route.js

import bcrypt from "bcrypt";
import { getDatabase } from "@/lib/mongodb";
import { signJWT } from "@/lib/auth";
import { errorResponse, successResponse, optionsResponse, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = (body.username || body.email || body.identifier || "").trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return errorResponse("Username/email and password are required", 400);
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({
      $or: [
        { email: { $regex: `^${identifier}$`, $options: "i" } },
        { username: { $regex: `^${identifier}$`, $options: "i" } },
      ],
    });

    if (!user) {
      return errorResponse("Invalid username/email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse("Invalid username/email or password", 401);
    }

    const userPayload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = signJWT(userPayload);

    const response = successResponse({
      message: "Login successful",
      user: userPayload,
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    printExceptionLog("Login", error);
    return errorResponse("Internal server error during login", 500);
  }
}
