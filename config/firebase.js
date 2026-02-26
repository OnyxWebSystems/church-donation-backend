/**
 * Firebase Admin initialization.
 * Uses FIREBASE_SERVICE_ACCOUNT_PATH (e.g. ./serviceAccountKey.json) or
 * GOOGLE_APPLICATION_CREDENTIALS. If file is missing, logs clear error.
 * Does NOT crash the server - returns null on failure.
 */
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let db = null;
let initError = null;

export function initFirebase() {
  if (db) return db;
  if (initError) return null;

  const credPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credPath || !credPath.trim()) {
    console.error("[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS is not set. Donations will not be persisted.");
    initError = true;
    return null;
  }

  const resolvedPath = credPath.startsWith("/") || /^[A-Za-z]:/.test(credPath)
    ? credPath
    : join(process.cwd(), credPath.replace(/^\.\//, ""));

  if (!existsSync(resolvedPath)) {
    console.error(`[Firebase] Service account file not found at: ${resolvedPath}. Check FIREBASE_SERVICE_ACCOUNT_PATH. Donations will not be persisted.`);
    initError = true;
    return null;
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(resolvedPath, "utf8"));
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error("[Firebase] Invalid service account file: missing project_id, private_key, or client_email.");
      initError = true;
      return null;
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log("[Firebase] Initialized successfully.");
    return db;
  } catch (err) {
    console.error("[Firebase] Initialization failed:", err.message);
    initError = true;
    return null;
  }
}

export { admin };
