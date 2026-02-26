import "dotenv/config"; // MUST be first - loads .env before any module reads process.env
import express from "express";
import cors from "cors";
import donationRoutes from "./routes/donationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

console.log("Loaded key:", process.env.PAYSTACK_SECRET_KEY ? `${process.env.PAYSTACK_SECRET_KEY.substring(0, 12)}...` : "(not set)");

const app = express();

app.use(cors());

// Webhook MUST use raw body for Paystack signature verification (mount before express.json)
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Church Donation Backend Running");
});

app.use("/api", donationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


