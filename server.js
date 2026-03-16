import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import donationRoutes from "./routes/donationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import donationAdminRoutes from "./routes/donationAdminRoutes.js";

const app = express();

app.use(cors());

// Webhook MUST use raw body for Paystack signature verification (mount before express.json)
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());

app.use("/api", donationRoutes);
app.use("/api", donationAdminRoutes);

app.get("/", (req, res) => {
  res.send("Church Donation Backend Running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Error handling middleware – must be last
app.use((err, req, res, next) => {
  console.error("[Error]", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
