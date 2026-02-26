import paystack from "../config/paystack.js";

/**
 * Initialize Paystack payment. Does NOT create orders - only webhook does.
 * @param {string} email - Payer email
 * @param {number} amount - Amount in main currency unit
 * @param {Object} metadata - Custom metadata (name, surname, businessName, phone, custom_payment_reference)
 */
export const initializePayment = async (email, amount, metadata = {}) => {
  return await paystack.post("/transaction/initialize", {
    email,
    amount: amount * 100, // Paystack uses kobo (multiply by 100)
    metadata: sanitizeMetadata(metadata),
  });
};

/**
 * Sanitize metadata - Paystack requires string values for metadata keys
 */
function sanitizeMetadata(obj) {
  const meta = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && v !== "") meta[k] = String(v);
  }
  return meta;
}

export const verifyPayment = async (reference) => {
  return await paystack.get(`/transaction/verify/${reference}`);
};
