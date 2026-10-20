import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_placeholder";

export function signJWT(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJWT(req) {
  try {
    let token = null;

    // 1. Try to read from cookies
    if (req.cookies && typeof req.cookies.get === "function") {
      token = req.cookies.get("token")?.value;
    }

    // 2. Try to read from Authorization header if cookie not present
    if (!token && req.headers && typeof req.headers.get === "function") {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return null;
  }
}

export function requireAuth(req) {
  const user = verifyJWT(req);
  if (!user) {
    return { error: "Authentication required", status: 401 };
  }
  return { user };
}

export function requireRole(req, allowedRoles = []) {
  const auth = requireAuth(req);
  if (auth.error) return auth;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (roles.length > 0 && !roles.includes(auth.user.role)) {
    return { error: `Forbidden: Requires role in [${roles.join(", ")}]`, status: 403 };
  }

  return { user: auth.user };
}
