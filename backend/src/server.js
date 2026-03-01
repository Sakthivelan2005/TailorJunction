// backend/src/server.js
import cors from "cors";
import express from "express";
import path from "path";
import {
  checkPhoneExists,
  login,
  signup,
  verifyOtp,
} from "./authController.js";
import shopDetailsRoutes from "./routes/shopDetails.js";

const app = express();

app.use("/uploads", express.static(path.join("/uploads")));

// Middleware - ALL require()
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend LIVE!" });
});

// Auth routes
app.post("/api/signup", signup);
app.post("/api/login", login);
app.post("/api/verify-otp", verifyOtp);

// Backend: POST /api/check-phone
app.post("/api/check-phone", checkPhoneExists);

app.use("/api", shopDetailsRoutes);
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
