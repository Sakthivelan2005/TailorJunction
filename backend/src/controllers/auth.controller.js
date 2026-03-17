// Backend/src/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export const getUserFullName = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  try {
    let query = "";

    // STEP 1: Check the prefix to determine the table
    if (id.startsWith("T")) {
      // It's a Tailor
      query = `SELECT tailor_name AS fullName FROM tailor_shop_profile WHERE tailor_id = ?`;
    } else if (id.startsWith("C")) {
      // It's a Customer
      query = `SELECT customer_name AS fullName FROM customer_profile WHERE customer_id = ?`;
    } else {
      // Invalid ID format
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    // STEP 2: Execute the targeted query
    const [rows] = await pool.query(query, [id]);
    console.log("Requested ID for name: ", id);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // STEP 3: Return the unified result
    res.json({
      success: true,
      fullName: rows[0].fullName,
    });
  } catch (error) {
    console.error("Error fetching user name:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching name" });
  }
};

export const loginUser = async (req, res) => {
  const { identifier, password, role } = req.body;
  console.log("Login attempt for:", identifier, " Role: ", role);

  if (!identifier || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide email/mobile and password.",
    });
  }

  try {
    const [users] = await pool.query(
      `SELECT user_id, role, password_hash FROM users WHERE role = ? AND (email = ? OR phone = ?)`,
      [role, identifier, identifier],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. User not found.",
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    res.json({
      success: true,
      userId: user.user_id,
      role: user.role,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const signup = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const data = req.body;
    console.log("Received signup data:", data);

    // GHOST BUSTER LOGIC 1: Catch incomplete signups by Phone or Email
    const [existingUsers] = await connection.execute(
      `SELECT user_id FROM users WHERE (phone = ? OR email = ?) AND role = ?`,
      [data.phone, data.email, data.role],
    );

    if (existingUsers.length > 0) {
      const ghostId = existingUsers[0].user_id;

      if (data.role === "tailor") {
        // Check if they ever finished the Shop Specialization page
        const [profile] = await connection.execute(
          `SELECT shop_name FROM tailor_shop_profile WHERE tailor_id = ?`,
          [ghostId],
        );

        // If the shop_name is null/empty, they crashed/abandoned step 2. Delete them!
        if (profile.length > 0 && !profile[0].shop_name) {
          console.log(
            `👻 Ghost Buster: Cleaning up abandoned tailor account ${ghostId}`,
          );
          // Explicitly delete from profile first to avoid Foreign Key conflicts, then delete user
          await connection.execute(
            `DELETE FROM tailor_shop_profile WHERE tailor_id = ?`,
            [ghostId],
          );
          await connection.execute(`DELETE FROM users WHERE user_id = ?`, [
            ghostId,
          ]);
        } else {
          throw new Error(
            "This Phone or Email is already registered to an active account.",
          );
        }
      } else {
        throw new Error("This Phone or Email is already registered.");
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 1. INSERT fresh user
    const [userResult] = await connection.execute(
      `INSERT INTO users (role, phone, email, password_hash, dob) 
       VALUES (?, ?, ?, ?, ?)`,
      [data.role, data.phone, data.email, passwordHash, data.dob || null],
    );

    const [idResult] = await connection.execute(
      "SELECT LAST_INSERT_ID() as lastId",
    );
    const numericId = idResult[0].lastId;

    const [userRows] = await connection.execute(
      "SELECT user_id FROM users WHERE role = ? AND phone = ? ORDER BY created_at DESC LIMIT 1",
      [data.role, data.phone],
    );

    const userId = userRows[0]?.user_id;

    if (!userId) {
      throw new Error("Failed to generate user_id - check database triggers");
    }

    // 2. UPDATE the auto-generated profile row with the user's Full Name
    if (data.role === "customer") {
      await connection.execute(
        `UPDATE customer_profile SET customer_name = ? WHERE customer_id = ?`,
        [data.fullName, userId],
      );
    } else if (data.role === "tailor") {
      await connection.execute(
        `UPDATE tailor_shop_profile SET tailor_name = ? WHERE tailor_id = ?`,
        [data.fullName, userId],
      );
    }

    console.log("✅ New user created:", { userId, numericId });

    await connection.commit();

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
    await connection.rollback();
    console.error("Signup error:", error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};

export const checkPhoneExists = async (req, res) => {
  try {
    const { phone, role } = req.body;
    console.log("Checking phone existence for:", phone, " Role: ", role);

    const [rows] = await pool.execute(
      `SELECT user_id FROM users WHERE phone = ? AND role = ?`,
      [phone, role],
    );

    if (rows.length > 0) {
      const userId = rows[0].user_id;

      // GHOST BUSTER LOGIC 2: Intercept the "Send OTP" check
      if (role === "tailor") {
        const [profile] = await pool.execute(
          `SELECT shop_name FROM tailor_shop_profile WHERE tailor_id = ?`,
          [userId],
        );

        if (profile.length > 0 && !profile[0].shop_name) {
          console.log(
            `👻 Ghost Buster: Deleting abandoned account ${userId} so they can re-verify OTP.`,
          );
          await pool.execute(
            `DELETE FROM tailor_shop_profile WHERE tailor_id = ?`,
            [userId],
          );
          await pool.execute(`DELETE FROM users WHERE user_id = ?`, [userId]);

          // Return false so the frontend thinks it's a brand new phone number!
          return res.json({ exists: false, userId: null });
        }
      }

      return res.json({ exists: true, userId });
    }

    res.json({ exists: false, userId: null });
  } catch (error) {
    console.error("Phone check error:", error);
    res.status(500).json({ success: false, error: "Phone check failed" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const validOtp = "123456";

    if (otp === validOtp) {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, error: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    const [rows] = await pool.execute(
      `SELECT user_id, role, password_hash 
       FROM users 
       WHERE phone = ? AND role = ?`,
      [phone, role],
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      userId: user.user_id,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
};
