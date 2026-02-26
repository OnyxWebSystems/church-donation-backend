import express from "express";
import { handlePaystackWebhook } from "../controllers/webhookController.js";

const router = express.Router();

/**
 * POST /api/webhook - Paystack webhook.
 * Requires raw body for signature verification. Wire with express.raw() in server.
 */
router.post("/", handlePaystackWebhook);

export default router;
