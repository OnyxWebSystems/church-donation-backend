import { initializePayment } from "../services/paystackService.js";
import crypto from "crypto";

/**
 * Initialize donation payment. Does NOT create orders - only webhook does.
 * Passes metadata for later use when webhook creates the donation record.
 */
export const createDonation = async (req, res) => {
  try {
    const { name, surname, email, businessName, phone, amount } = req.body;

    if (!name || !surname || !email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, surname, email, and amount are required",
      });
    }

    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    const paymentReference = crypto.randomUUID();

    const metadata = {
      name,
      surname,
      businessName: businessName ?? "",
      phone: phone ?? "",
      custom_payment_reference: paymentReference,
    };

    const response = await initializePayment(email, amountNum, metadata);

    const authUrl = response?.data?.data?.authorization_url;
    const reference = response?.data?.data?.reference;

    if (!authUrl || !reference) {
      console.error("Paystack response missing authorization_url or reference:", response?.data);
      return res.status(502).json({
        success: false,
        message: "Invalid response from payment provider",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment initialized",
      authorization_url: authUrl,
      paymentUrl: authUrl, // backward compatibility
      reference,
      paymentReference,
    });
  } catch (error) {
    const errData = error.response?.data;
    const status = errData?.status === false ? 400 : 500;
    console.error("Donation init error:", errData || error.message);
    res.status(status).json({
      success: false,
      message: errData?.message || "Payment initialization failed",
    });
  }
};
