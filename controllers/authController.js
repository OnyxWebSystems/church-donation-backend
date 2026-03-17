import { findUserByEmail, verifyPassword, generateJwtToken } from "../services/authService.js";

export async function login(req, res) {
  const email = req.body?.email;
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await findUserByEmail(email);
  if (!user || user.role !== "admin") {
    console.warn("[Auth] login failure: user not found or not admin", { email: String(email) });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    console.warn("[Auth] login failure: invalid password", { email: user.email });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateJwtToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });

  console.info("[Auth] login success", { userId: user.userId, email: user.email, role: user.role });

  return res.json({
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

