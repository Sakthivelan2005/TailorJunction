const express = require("express");
const cors = require("cors");
const { signup, verifyOtp } = require("./authController");
const db = require("./db");
const app = express();

// Middleware - ALL require()
app.use(cors());
app.use(express.json());

db.query("SELECT 1")
  .then(() => console.log("✅ MySQL Connected via Workbench credentials"))
  .catch((err) => console.log("❌ DB Connection Failed:", err));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend LIVE!" });
});

// Auth routes
app.post("/api/signup", signup);
app.post("/api/verify-otp", verifyOtp);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
