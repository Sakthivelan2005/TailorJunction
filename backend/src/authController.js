const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const pool = require("./db"); // Adjust path to your db.js

// Signup function
const signup = async (req, res) => {
  try {
    const data = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Insert user (triggers auto-generate user_id + profile)
    const [userResult] = await pool.execute(
      `INSERT INTO users (role, phone, email, password_hash) 
       VALUES (?, ?, ?, ?)`,
      [data.role, data.phone, data.email, passwordHash],
    );

    const userId = userResult.insertId;

    // Update profile
    if (data.role === "customer") {
      await pool.execute(
        `UPDATE customer_profile SET 
         customer_name = ?, house_no = ?, street = ?, area = ?
         WHERE customer_id = ?`,
        [data.fullName, data.house_no, data.street, data.area, userId],
      );
    } else {
      await pool.execute(
        `UPDATE tailor_shop_profile SET 
         tailor_name = ?, shop_name = ?, house_no = ?, street = ?, area = ?
         WHERE tailor_id = ?`,
        [
          data.fullName,
          `${data.fullName}'s Shop`,
          data.house_no,
          data.street,
          data.area,
          userId,
        ],
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { userId, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      message: "User created successfully!",
      userId,
      role: data.role,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// OTP verification
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // In production: verify OTP from session/cache
    // For now: generate dummy OTP match
    const validOtp = "123456"; // Replace with real OTP verification

    if (otp === validOtp) {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, error: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  signup,
  verifyOtp,
};
