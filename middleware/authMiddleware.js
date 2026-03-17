import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(header) ? header[0] : header;

  if (!value || typeof value !== "string") {
    console.warn("[Auth] missing Authorization header");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [scheme, token] = value.split(" ");
  if (scheme !== "Bearer" || !token) {
    console.warn("[Auth] invalid Authorization header format");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[Auth] JWT_SECRET is not configured");
    return res.status(500).json({ error: "Internal Server Error" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn("[Auth] invalid token", { message: err.message });
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    console.warn("[Auth] forbidden: non-admin role", { role: req.user?.role });
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

