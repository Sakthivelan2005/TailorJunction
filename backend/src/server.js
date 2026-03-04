// backend/src/server.js
import cors from "cors";
import express from "express";
import cron from "node-cron";
import path from "path";
import {
  checkPhoneExists,
  login,
  signup,
  verifyOtp,
} from "./authController.js";
import { updateAutoCloseSetting } from "./controllers/tailor.controller.js";
import dressTypesRoutes from "./routes/dressTypes.js";
import shopDetailsRoutes from "./routes/shopDetails.js";
import tailorRoutes from "./routes/tailor.routes.js";
import tailorPricingRoutes from "./routes/tailorPricing.js";

const app = express();

// Middleware - ALL require()
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend LIVE!" });
});

// Static files for uploads
app.use("/uploads", express.static(path.join("/uploads")));

// Auth routes
app.post("/api/signup", signup);
app.post("/api/login", login);
app.post("/api/verify-otp", verifyOtp);

// Backend: POST /api/check-phone
app.post("/api/check-phone", checkPhoneExists);

app.use("/api", dressTypesRoutes);
app.use("/api", shopDetailsRoutes);
app.use("/api", tailorPricingRoutes);

// Mount the tailor routes
app.use("/api/tailor", tailorRoutes);

// updating auto-close setting
app.put("/api/tailor/:tailorId/settings/autoclose", updateAutoCloseSetting);

cron.schedule(
  "0 23 * * *",
  async () => {
    console.log("⏰ Running 11:00 PM Auto-Close Cron Job...");
    try {
      // ONLY updates tailors who are currently 'available' AND have the setting enabled
      const [result] = await db.query(`
            UPDATE tailor_shop_profile 
            SET availability_status = 'unavailable' 
            WHERE availability_status = 'available' 
            AND is_auto_close_enabled = TRUE
        `);
      console.log(
        `✅ Automatically closed ${result.affectedRows} opted-in tailor shops.`,
      );
    } catch (error) {
      console.error("❌ Failed to run auto-close cron job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  },
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
