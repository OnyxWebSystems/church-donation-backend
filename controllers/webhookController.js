/**
 * Paystack webhook handler.
 * Verifies signature, processes charge.success, creates donation record only here.
 * Implements idempotency to prevent duplicate writes.
 */
import crypto from "crypto";
import {
  createDonationRecord,
  donationExistsByPaystackReference,
} from "../services/firebaseService.js";
import {
  logWebhookReceived,
  logSignatureSuccess,
  logSignatureFailure,
  logPaymentVerified,
  logDuplicateTransaction,
  logFirestoreWriteSuccess,
  logFirestoreWriteError,
} from "../utils/logger.js";

const EVENT_CHARGE_SUCCESS = "charge.success";

/** Convert Paystack amount from kobo to Rands (divide by 100) */
function koboToRands(kobo) {
  return (Number(kobo) || 0) / 100;
}

/**
 * Verify Paystack webhook signature using HMAC-SHA512.
 * Uses x-paystack-signature header and process.env.PAYSTACK_SECRET_KEY.
 * Uses raw request body (Buffer) - must be used with express.raw().
 */
function verifyPaystackSignature(rawBody, signature) {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  if (!secretKey || !signature || !rawBody) return false;
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
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

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }

  const reference = payload?.data?.reference
    ? String(payload.data.reference)
    : null;
  logWebhookReceived(reference, payload?.event);

  if (!verifyPaystackSignature(rawBody, signature)) {
    logSignatureFailure(reference, "Invalid signature");
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }
  logSignatureSuccess(reference);

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
      logDuplicateTransaction(paystackReference);
      return res.status(200).json({ success: true, message: "Duplicate webhook ignored" });
    }
  } catch (err) {
    logFirestoreWriteError(paystackReference, err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }

  try {
    const metadata = data.metadata || {};
    const auth = data.authorization || {};
    const name = [metadata.name, metadata.surname].filter(Boolean).join(" ").trim() || null;

    const donation = {
      amount: koboToRands(data.amount),
      currency: data.currency || "ZAR",
      email: data.customer?.email || null,
      fullName: name,
      phone: metadata.phone || null,
      paymentStatus: data.status || null,
      paymentChannel: data.channel || null,
      cardType: auth.card_type || null,
      bank: auth.bank || null,
      country: auth.country_code || null,
      paystackReference,
      paystackTransactionId: data.id || null,
      paystackFees: koboToRands(data.fees),
      paidAt: data.paid_at || new Date().toISOString(),
      source: "paystack",
      environment: process.env.NODE_ENV || "development",
    };

    logPaymentVerified(paystackReference);

    const docId = await createDonationRecord(donation);
    logFirestoreWriteSuccess(paystackReference, docId);
    return res.status(200).json({ success: true, message: "Donation recorded" });
  } catch (err) {
    logFirestoreWriteError(paystackReference, err);
    return res.status(500).json({ success: false, message: "Failed to record donation" });
  }
}
