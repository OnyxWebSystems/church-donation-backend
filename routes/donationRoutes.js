import express from "express";
import rateLimit from "express-rate-limit";
import { createDonation } from "../controllers/donationController.js";

const router = express.Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/pay", paymentLimiter, createDonation);

export default router;
