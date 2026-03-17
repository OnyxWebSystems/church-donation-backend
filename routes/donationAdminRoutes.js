import express from "express";
import {
  listDonations,
  getDonation,
  getStats,
} from "../controllers/donationAdminController.js";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/donations", authMiddleware, requireAdmin, listDonations);
router.get("/donations/:reference", authMiddleware, requireAdmin, getDonation);
router.get("/stats", authMiddleware, requireAdmin, getStats);

export default router;
