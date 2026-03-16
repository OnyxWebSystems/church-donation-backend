import express from "express";
import {
  listDonations,
  getDonation,
  getStats,
} from "../controllers/donationAdminController.js";

const router = express.Router();

router.get("/donations", listDonations);
router.get("/donations/:reference", getDonation);
router.get("/stats", getStats);

export default router;
