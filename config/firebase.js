/**
 * Firebase Admin initialization.
 * Supports two credential modes:
 * 1. Service account file: FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS
 * 2. Individual env vars (cloud deployment): FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Does NOT crash the server - returns null on failure.
 */
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let db = null;
let initError = null;

function getCredential() {
  // Option 1: Individual env vars (preferred for cloud)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  // Option 2: Service account file
  const credPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credPath || !credPath.trim()) {
    return null;
  }

  const resolvedPath =
    credPath.startsWith("/") || /^[A-Za-z]:/.test(credPath)
      ? credPath
      : join(process.cwd(), credPath.replace(/^\.\//, ""));

  if (!existsSync(resolvedPath)) {
    return null;
  }

  const serviceAccount = JSON.parse(readFileSync(resolvedPath, "utf8"));
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    return null;
  }
  return admin.credential.cert(serviceAccount);
}

export function initFirebase() {
  if (db) return db;
  if (initError) return null;

  const credential = getCredential();

  if (!credential) {
    if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error(
        "[Firebase] Credentials not set. Use FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH. Donations will not be persisted."
      );
    } else {
      console.error("[Firebase] Invalid or missing credentials. Donations will not be persisted.");
    }
    initError = true;
    return null;
  }

  try {
    admin.initializeApp({ credential });
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
