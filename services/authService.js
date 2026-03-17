import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initFirebase } from "../config/firebase.js";

const USERS_COLLECTION = "users";

function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
  return { secret, expiresIn };
}

export async function findUserByEmail(email) {
  const db = initFirebase();
  if (!db) return null;

  const raw = String(email ?? "").trim();
  if (!raw) return null;

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where("email", "==", raw)
    .limit(1)
    .get();

  if (snapshot.empty) {
    const normalized = raw.toLowerCase();
    if (normalized !== raw) {
      const snapshot2 = await db
        .collection(USERS_COLLECTION)
        .where("email", "==", normalized)
        .limit(1)
        .get();

      if (snapshot2.empty) return null;
      const doc2 = snapshot2.docs[0];
      return { userId: doc2.id, ...doc2.data() };
    }
    return null;
  }

  const doc = snapshot.docs[0];
  return { userId: doc.id, ...doc.data() };
}

export async function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return bcrypt.compare(String(plainPassword), String(passwordHash));
}

export function generateJwtToken(payload) {
  const { secret, expiresIn } = getJwtConfig();
  if (!secret) {
    const err = new Error("JWT_SECRET is not configured");
    err.code = "JWT_SECRET_MISSING";
    throw err;
  }

  return jwt.sign(payload, secret, { expiresIn });
}

