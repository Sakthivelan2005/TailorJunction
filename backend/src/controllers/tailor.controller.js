import db from "../db.js";
// --- HOME / DASHBOARD SCREEN ---
export const getDashboardData = async (req, res) => {
  const { tailorId } = req.params;

  try {
    // 1. Get Basic Info & Status
    const [tailorInfo] = await db.query(
      `
      SELECT t.tailor_name, t.shop_name, t.profile_photo, t.availability_status, u.created_at 
      FROM tailor_shop_profile t
      JOIN users u ON t.tailor_id = u.user_id
      WHERE t.tailor_id = ?
    `,
      [tailorId],
    );

    if (tailorInfo.length === 0)
      return res.status(404).json({ message: "Tailor not found" });

    // 2. Get Aggregated Stats
    const [stats] = await db.query(
      `
      SELECT 
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completedOrders,
        COUNT(CASE WHEN order_status IN ('pending', 'accepted') THEN 1 END) as pendingOrders,
        COALESCE(SUM(CASE WHEN order_status = 'completed' THEN price ELSE 0 END), 0) as totalRevenue,
        COUNT(DISTINCT customer_id) as totalCustomers
      FROM orders 
      WHERE tailor_id = ?
    `,
      [tailorId],
    );

    // 3. Get Average Rating
    const [ratingRes] = await db.query(
      `
      SELECT COALESCE(AVG(rating), 0) as averageRating 
      FROM reviews 
      WHERE tailor_id = ?
    `,
      [tailorId],
    );

    // Calculate App Experience (Days since creation)
    const createdAt = new Date(tailorInfo[0].created_at);
    const now = new Date();
    const diffTime = Math.abs(now - createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const avgOrdersPerDay = (
      stats[0].completedOrders / (diffDays || 1)
    ).toFixed(1);

    res.json({
      profile: tailorInfo[0],
      stats: {
        ...stats[0],
        averageRating: Number(ratingRes[0].averageRating).toFixed(1),
        avgOrdersPerDay,
        daysInApp: diffDays,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching dashboard" });
  }
};

// --- ORDERS SCREEN ---
export const getOrders = async (req, res) => {
  const { tailorId } = req.params;

  try {
    // Fetch Pending Orders
    const [pendingOrders] = await db.query(
      `
      SELECT o.order_id, d.dress_name as cloth_type, o.order_status as status 
      FROM orders o
      JOIN dress_types d ON o.dress_id = d.dress_id
      WHERE o.tailor_id = ? AND o.order_status IN ('pending', 'accepted')
      ORDER BY o.order_datetime DESC
    `,
      [tailorId],
    );

    // Fetch Completed Orders with Feedback
    const [completedOrders] = await db.query(
      `
      SELECT o.order_id, d.dress_name as cloth_type, r.review_text as feedback, r.rating 
      FROM orders o
      JOIN dress_types d ON o.dress_id = d.dress_id
      LEFT JOIN reviews r ON o.order_id = r.order_id
      WHERE o.tailor_id = ? AND o.order_status = 'completed'
      ORDER BY o.order_datetime DESC
    `,
      [tailorId],
    );

    res.json({ pendingOrders, completedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching orders" });
  }
};

// --- PROFILE SCREEN ---
export const getProfile = async (req, res) => {
  const { tailorId } = req.params;

  try {
    // Fetch Profile & Address Details
    const [profileDetails] = await db.query(
      `
      SELECT t.tailor_name, t.shop_name, u.phone, u.email, 
             t.house_no, t.street, t.area, t.district, t.state, t.pincode, t.profile_photo
      FROM tailor_shop_profile t
      JOIN users u ON t.tailor_id = u.user_id
      WHERE t.tailor_id = ?
    `,
      [tailorId],
    );

    // Fetch Pricing Table
    const [pricing] = await db.query(
      `
      SELECT d.dress_name as cloth_type, tp.price 
      FROM tailor_pricing tp
      JOIN dress_types d ON tp.dress_id = d.dress_id
      WHERE tp.tailor_id = ?
    `,
      [tailorId],
    );

    if (profileDetails.length === 0)
      return res.status(404).json({ message: "Tailor not found" });

    res.json({
      details: profileDetails[0],
      pricing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

// --- SETTINGS SCREEN ---
export const getSettings = async (req, res) => {
  const { tailorId } = req.params;

  try {
    const [settings] = await db.query(
      `
      SELECT auto_close_time, availability_status 
      FROM tailor_shop_profile 
      WHERE tailor_id = ?
    `,
      [tailorId],
    );

    res.json(settings[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching settings" });
  }
};

// --- UPDATE AUTO-CLOSE PREFERENCE ---
export const updateAutoCloseSetting = async (req, res) => {
  const { tailorId } = req.params;
  const { autoCloseEnabled } = req.body;

  try {
    // MySQL translates JS true/false to 1/0 automatically
    await db.query(
      `UPDATE tailor_shop_profile SET is_auto_close_enabled = ? WHERE tailor_id = ?`,
      [autoCloseEnabled, tailorId],
    );
    res.json({ message: "Auto-close setting updated successfully" });
  } catch (error) {
    console.error("DB Update Error:", error);
    res
      .status(500)
      .json({ error: "Failed to update auto-close setting in database" });
  }
};

export const updateAvailability = async (req, res) => {
  const { tailorId } = req.params;
  const { status } = req.body; // 'available' or 'unavailable'

  try {
    await db.query(
      `UPDATE tailor_shop_profile SET availability_status = ? WHERE tailor_id = ?`,
      [status, tailorId],
    );

    // BROADCAST TO ALL CUSTOMERS INSTANTLY
    req.io.emit("tailorStatusChanged", { tailorId, status });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

// --- UPDATE ORDER STATUS (Tailor Accepting/Completing) ---
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'accepted', 'completed', etc.

  try {
    await db.query(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [
      status,
      orderId,
    ]);

    // 🚀 Instantly tell the customer their order progress bar should move!
    req.io.emit("orderStatusUpdated", { orderId: Number(orderId), status });

    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update order status" });
  }
};
