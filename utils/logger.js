/**
 * Structured production logging.
 * Use for webhook, Firestore, and critical operations.
 */
const timestamp = () => new Date().toISOString();

export function logWebhookReceived(reference, event) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: timestamp(),
      event: "webhook_received",
      reference: reference || null,
      paystackEvent: event,
    })
  );
}

export function logSignatureSuccess(reference) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: timestamp(),
      event: "signature_verified",
      reference,
    })
  );
}

export function logPaymentVerified(reference) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: timestamp(),
      event: "payment_verified",
      reference,
    })
  );
}

export function logSignatureFailure(reference, reason) {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: timestamp(),
      event: "signature_verification_failed",
      reference: reference || null,
      reason: reason || "Invalid signature",
    })
  );
}

export function logDuplicateTransaction(reference) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: timestamp(),
      event: "duplicate_webhook_ignored",
      reference,
      message: "Duplicate webhook ignored",
    })
  );
}

export function logFirestoreWriteSuccess(reference, docId) {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: timestamp(),
      event: "firestore_write_success",
      reference,
      documentId: docId,
    })
  );
}

export function logFirestoreWriteError(reference, err) {
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: timestamp(),
      event: "firestore_write_error",
      reference,
      error: err?.message || String(err),
    })
  );
}
