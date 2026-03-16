/**
 * Admin service for querying donations and stats.
 */
import { initFirebase } from "../config/firebase.js";

const DONATIONS_COLLECTION = "donations";
const DEFAULT_LIMIT = 50;

/**
 * Get latest donations.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getLatestDonations(limit = DEFAULT_LIMIT) {
  const db = initFirebase();
  if (!db) return [];

  const snapshot = await db
    .collection(DONATIONS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(Math.min(limit, 100))
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get a single donation by Paystack reference.
 * @param {string} reference
 * @returns {Promise<object|null>}
 */
export async function getDonationByReference(reference) {
  const db = initFirebase();
  if (!db) return null;

  const snapshot = await db
    .collection(DONATIONS_COLLECTION)
    .where("paystackReference", "==", reference)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get aggregate donation stats.
 * @returns {Promise<{totalDonations: number, totalAmount: number, donationCount: number}>}
 */
export async function getDonationStats() {
  const db = initFirebase();
  if (!db) {
    return { totalDonations: 0, totalAmount: 0, donationCount: 0 };
  }

  const snapshot = await db.collection(DONATIONS_COLLECTION).get();

  let totalAmount = 0;
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalAmount += Number(data.amount) || 0;
  });

  return {
    totalDonations: totalAmount,
    totalAmount,
    donationCount: snapshot.size,
  };
}
