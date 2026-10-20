// src/lib/cors.js

export function getCorsHeaders(req) {
  const origin = req ? req.headers?.get("origin") : null;
  const allowedOrigin = origin || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://web-final-2026-01-frontend.vercel.app");

  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id, x-user-username, x-user-email, x-user-role",
    "Access-Control-Max-Age": "86400",
  };
}

let corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : "https://web-final-2026-01-frontend.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id, x-user-username, x-user-email, x-user-role",
  "Access-Control-Max-Age": "86400",
};

export default corsHeaders;
