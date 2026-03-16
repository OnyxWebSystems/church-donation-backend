import {
  getLatestDonations,
  getDonationByReference,
  getDonationStats,
} from "../services/donationAdminService.js";

export async function listDonations(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const donations = await getLatestDonations(limit);
    res.json({ success: true, data: donations });
  } catch (err) {
    console.error("[Admin] listDonations error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

export async function getDonation(req, res) {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ success: false, error: "Reference required" });
    }
    const donation = await getDonationByReference(reference);
    if (!donation) {
      return res.status(404).json({ success: false, error: "Donation not found" });
    }
    res.json({ success: true, data: donation });
  } catch (err) {
    console.error("[Admin] getDonation error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

export async function getStats(req, res) {
  try {
    const stats = await getDonationStats();
    res.json({
      success: true,
      data: {
        totalDonations: stats.totalAmount,
        totalAmount: stats.totalAmount,
        donationCount: stats.donationCount,
      },
    });
  } catch (err) {
    console.error("[Admin] getStats error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
