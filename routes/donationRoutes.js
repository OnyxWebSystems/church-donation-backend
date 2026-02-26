import express from "express";
import { createDonation } from "../controllers/donationController.js";

const router = express.Router();

router.post("/pay", createDonation);

export default router;
