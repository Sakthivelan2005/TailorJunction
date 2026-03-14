import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js"; // Assuming db.js exports your MySQL pool

// --- ADMIN SIGNUP ---
export const adminSignup = async (req, res) => {
  const { phone, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🚀 We DO NOT pass user_id. Your 'before_insert_users' trigger handles it!
    await db.query(
      `INSERT INTO users (role, phone, email, password_hash, auth_provider) 
       VALUES ('admin', ?, ?, ?, 'email')`,
      [phone, email, hashedPassword],
    );

    res.json({ success: true, message: "Admin account created successfully!" });
  } catch (error) {
    // Catch your custom SQL SIGNAL errors (e.g., 'Email already exists for this role.')
    if (error.sqlState === "45000") {
      return res
        .status(400)
        .json({ success: false, message: error.sqlMessage });
    }
    console.error("Admin Signup Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during admin signup." });
  }
};

// --- 1. ADMIN LOGIN ---
export const adminLogin = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const [admins] = await db.query(
      `SELECT user_id, role, password_hash FROM users WHERE role = 'admin' AND (email = ? OR phone = ?)`,
      [identifier, identifier],
    );

    if (admins.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Admin Credentials." });
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password." });
    }

    const token = jwt.sign(
      { userId: admin.user_id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      token,
      userId: admin.user_id,
      message: "Admin Login Successful",
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};

// --- 2. GET PENDING TAILORS ---
export const getPendingTailors = async (req, res) => {
  try {
    const [tailors] = await db.query(
      `SELECT t.*, u.phone, u.email 
       FROM tailor_shop_profile t
       JOIN users u ON t.tailor_id = u.user_id
       WHERE t.verification_status = 'pending'
       ORDER BY t.uploaded_at ASC`,
    );
    res.json({ success: true, tailors });
  } catch (error) {
    console.error("Fetch Pending Tailors Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch verifications." });
  }
};

// --- 3. VERIFY OR REJECT TAILOR ---
export const verifyTailor = async (req, res) => {
  const { tailorId, action, adminId } = req.body; // action = 'verified' or 'rejected'

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update the Tailor's Status
    await connection.execute(
      `UPDATE tailor_shop_profile SET verification_status = ? WHERE tailor_id = ?`,
      [action, tailorId],
    );

    // 2. Record the action in the Audit Trail (admin_actions table)
    await connection.execute(
      `INSERT INTO admin_actions (admin_id, action_type, target_user_id, action_description) 
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        `TAILOR_${action.toUpperCase()}`,
        tailorId,
        `Admin marked shop as ${action}`,
      ],
    );

    // 3. Send a push notification to the Tailor
    await connection.execute(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [
        tailorId,
        `Account ${action}!`,
        `Your shop verification has been ${action} by the administrator.`,
      ],
    );

    await connection.commit();

    // 🚀 4. REAL-TIME SOCKET: Notify the specific tailor so their app unlocks instantly!
    if (req.io) {
      req.io.to(tailorId).emit("accountVerificationUpdate", { status: action });
    }

    res.json({ success: true, message: `Tailor successfully ${action}` });
  } catch (error) {
    await connection.rollback();
    console.error("Verify Tailor Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process verification." });
  } finally {
    connection.release();
  }
};

// --- 4. ADD NEW DRESS TO CATALOG ---
export const addDressType = async (req, res) => {
  const { category, dress_name, base_price } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO dress_types (category, dress_name, base_price) VALUES (?, ?, ?)`,
      [category, dress_name, base_price],
    );

    res.json({
      success: true,
      dress: { dress_id: result.insertId, category, dress_name, base_price },
    });
  } catch (error) {
    console.error("Add Dress Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add dress. It may already exist.",
    });
  }
};

// --- 5. DELETE DRESS FROM CATALOG ---
export const deleteDressType = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM dress_types WHERE dress_id = ?`, [id]);
    res.json({ success: true, message: "Dress deleted successfully" });
  } catch (error) {
    console.error("Delete Dress Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete dress." });
  }
};

// --- 6. GET DASHBOARD ANALYTICS ---
export const getDashboardData = async (req, res) => {
  try {
    // 1. KPI Stats
    const [[revenueResult]] = await db.query(
      `SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE order_status IN ('completed', 'accepted')`,
    );
    const [[ordersResult]] = await db.query(
      `SELECT COUNT(*) as total FROM orders`,
    );
    const [[tailorsResult]] = await db.query(
      `SELECT COUNT(*) as total FROM tailor_shop_profile WHERE availability_status = 'available'`,
    );
    const [[pendingResult]] = await db.query(
      `SELECT COUNT(*) as total FROM tailor_shop_profile WHERE verification_status = 'pending'`,
    );

    // 2. Revenue Trend (Last 7 Days)
    const [revenueTrend] = await db.query(`
      SELECT DATE_FORMAT(order_datetime, '%b %d') as date, COALESCE(SUM(price), 0) as revenue
      FROM orders 
      WHERE order_datetime >= DATE(NOW()) - INTERVAL 7 DAY
      GROUP BY DATE(order_datetime), DATE_FORMAT(order_datetime, '%b %d')
      ORDER BY DATE(order_datetime) ASC
    `);

    // 3. Dress Popularity
    const [dressPopularity] = await db.query(`
      SELECT d.dress_name as name, COUNT(o.order_id) as orders
      FROM orders o
      JOIN dress_types d ON o.dress_id = d.dress_id
      GROUP BY d.dress_id, d.dress_name
      ORDER BY orders DESC
      LIMIT 5
    `);

    // 4. Urgency Split (Normal vs 1-Day vs 2-Day)
    const [urgencySplit] = await db.query(`
      SELECT urgency as name, COUNT(*) as value
      FROM orders
      GROUP BY urgency
    `);

    // 5. Recent Activity Ticker
    const [recentActivity] = await db.query(`
      SELECT order_id as id, DATE_FORMAT(order_datetime, '%h:%i %p') as time, 
      CONCAT('<span class="text-highlight">Order #', order_id, '</span> placed for ₹', price) as text
      FROM orders
      ORDER BY order_datetime DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        revenue: Number(revenueResult.total),
        orders: ordersResult.total,
        activeTailors: tailorsResult.total,
        pendingVerifications: pendingResult.total,
      },
      charts: {
        revenueTrend:
          revenueTrend.length > 0
            ? revenueTrend
            : [{ date: "Today", revenue: 0 }],
        dressPopularity,
        urgencySplit,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load analytics." });
  }
};
