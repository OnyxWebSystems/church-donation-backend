/**
 * Paystack webhook handler.
 * Verifies signature, processes charge.success, creates donation record only here.
 */
import crypto from "crypto";
import { paystackSecretKey } from "../config/paystack.js";
import {
  createDonationRecord,
  donationExistsByPaystackReference,
} from "../services/firebaseService.js";

const EVENT_CHARGE_SUCCESS = "charge.success";

/** Convert Paystack amount from kobo to Rands (divide by 100) */
function koboToRands(kobo) {
  return (Number(kobo) || 0) / 100;
}

/**
 * Verify Paystack webhook signature using HMAC-SHA512.
 * Uses raw request body (Buffer) - must be used with express.raw().
 */
function verifyPaystackSignature(rawBody, signature) {
  if (!paystackSecretKey || !signature || !rawBody) return false;
  const hash = crypto.createHmac("sha512", paystackSecretKey).update(rawBody).digest("hex");
  const bufHash = Buffer.from(hash, "hex");
  const bufSig = Buffer.from(signature, "hex");
  if (bufHash.length !== bufSig.length) return false;
  return crypto.timingSafeEqual(bufHash, bufSig);
}

/**
 * Handle Paystack webhook. Must receive raw body via express.raw().
 */
export async function handlePaystackWebhook(req, res) {
  const rawBody = req.body;
  const signature = req.headers["x-paystack-signature"];

  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ success: false, message: "Invalid webhook body" });
  }

  if (!verifyPaystackSignature(rawBody, signature)) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }

  if (payload.event !== EVENT_CHARGE_SUCCESS) {
    return res.status(200).json({ success: true, message: "Event ignored" });
  }

  const data = payload.data;
  if (!data || !data.reference) {
    return res.status(400).json({ success: false, message: "Invalid payload data" });
  }

  const paystackReference = String(data.reference);

  try {
    const exists = await donationExistsByPaystackReference(paystackReference);
    if (exists) {
      return res.status(200).json({ success: true, message: "Donation already recorded (idempotent)" });
    }
  } catch (err) {
    console.error("[Webhook] Idempotency check failed:", err.message);
    return res.status(500).json({ success: false, message: "Internal error" });
  }

  try {
    const metadata = data.metadata || {};
    const auth = data.authorization || {};
    const name = [metadata.name, metadata.surname].filter(Boolean).join(" ").trim() || null;

    const donation = {
      amount: koboToRands(data.amount),
      currency: data.currency || "ZAR",
      paystackReference,
      paystackTransactionId: data.id || null,
      paymentStatus: data.status || null,
      paymentChannel: data.channel || null,
      paystackFees: koboToRands(data.fees),
      paidAt: data.paid_at || new Date().toISOString(),
      fullName: name,
      email: data.customer?.email || null,
      phone: metadata.phone || null,
      businessName: metadata.businessName || null,
      bank: auth.bank || null,
      cardType: auth.card_type || null,
      country: auth.country_code || null,
    };

    await createDonationRecord(donation);
    return res.status(200).json({ success: true, message: "Donation recorded" });
  } catch (err) {
    console.error("[Webhook] Firestore write failed:", err.message);
    return res.status(500).json({ success: false, message: "Failed to record donation" });
  }
}
