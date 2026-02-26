import axios from "axios";

/** Paystack secret key - used for API calls and webhook signature verification */
export const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();
const secretKey = paystackSecretKey;
if (!secretKey || !secretKey.startsWith("sk_")) {
  console.warn("PAYSTACK_SECRET_KEY is missing or invalid (must start with sk_test_ or sk_live_)");
}

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  },
});

export default paystack;
