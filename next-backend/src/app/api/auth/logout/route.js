// src/app/api/auth/logout/route.js

import { successResponse, optionsResponse } from "@/lib/utils";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST() {
  const response = successResponse({ message: "Logged out successfully" });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
