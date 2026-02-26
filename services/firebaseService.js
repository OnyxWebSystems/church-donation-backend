/**
 * Firebase service for donation persistence.
 * All Firebase/database logic lives here for modularity.
 */
import { initFirebase, admin } from "../config/firebase.js";

const DONATIONS_COLLECTION = "donations";

/**
 * Check if a donation with the given Paystack reference already exists.
 * Used for idempotency to prevent duplicate records.
 */
export async function donationExistsByPaystackReference(paystackReference) {
  const db = initFirebase();
  if (!db) return false;

  const snapshot = await db
    .collection(DONATIONS_COLLECTION)
    .where("paystackReference", "==", paystackReference)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Create a donation record in Firestore.
 * Called only by the webhook after charge.success.
 * @param {Object} donation - Full donation object with all required fields
 * @returns {Promise<string>} Document ID
 */
export async function createDonationRecord(donation) {
  const db = initFirebase();
  if (!db) {
    const err = new Error("Firebase not initialized - donation cannot be persisted");
    console.error("[Firebase] createDonationRecord:", err.message);
    throw err;
  }

  try {
    const docRef = await db.collection(DONATIONS_COLLECTION).add({
      ...donation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("[Firebase] Firestore write failed:", err.message);
    throw err;
  }
}
