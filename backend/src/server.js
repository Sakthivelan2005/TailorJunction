// backend/src/server.js
const express = require("express");
const cors = require("cors");
const { signup, verifyOtp, checkPhoneExists } = require("./authController");

const app = express();

// Middleware - ALL require()
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend LIVE!" });
});

// Auth routes
app.post("/api/signup", signup);
app.post("/api/verify-otp", verifyOtp);

// Backend: POST /api/check-phone
app.post("/api/check-phone", checkPhoneExists);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
