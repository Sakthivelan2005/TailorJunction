// --- CUSTOMER CONTROLLER ---
import db from "../db.js";

// --- GET ALL TAILORS (For Home & Tailors Screen) ---
export const getTailors = async (req, res) => {
  try {
    // This query grabs tailor details, calculates their average rating, and finds their lowest price
    const [tailors] = await db.query(`
      SELECT 
        t.tailor_id, 
        t.tailor_name, 
        t.shop_name, 
        t.profile_photo, 
        t.availability_status, 
        t.experience_years, 
        t.area,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as rating,
        COALESCE(MIN(tp.price), 0) as starting_price
      FROM tailor_shop_profile t
      LEFT JOIN reviews r ON t.tailor_id = r.tailor_id
      LEFT JOIN tailor_pricing tp ON t.tailor_id = tp.tailor_id
      GROUP BY t.tailor_id
    `);

    res.json({ success: true, tailors });
  } catch (error) {
    console.error("Error fetching tailors:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching tailors" });
  }
};

// --- PLACE A NEW ORDER ---
export const placeOrder = async (req, res) => {
  const { customerId, tailorId, dressId, urgency, measurementType } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO orders (customer_id, tailor_id, dress_id, urgency, measurement_type, order_status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [customerId, tailorId, dressId, urgency, measurementType],
    );

    // 🚀 THE FIX: Use a static event name and pass tailorId in the payload
    req.io.emit("newOrderPlaced", {
      orderId: result.insertId,
      tailorId: tailorId,
    });

    res.json({
      success: true,
      orderId: result.insertId,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// --- GET CUSTOMER ORDERS ---
export const getCustomerOrders = async (req, res) => {
  const { customerId } = req.params;

  try {
    // 🚀 Fetch Pending & Accepted Orders
    const [pendingOrders] = await db.query(
      `SELECT o.order_id, d.dress_name as cloth_type, o.order_status as status, 
              o.tailor_id, t.shop_name, o.urgency, o.order_datetime, o.price
       FROM orders o
       JOIN dress_types d ON o.dress_id = d.dress_id
       LEFT JOIN tailor_shop_profile t ON o.tailor_id = t.tailor_id
       WHERE o.customer_id = ? AND o.order_status IN ('pending', 'accepted')
       ORDER BY o.order_datetime DESC`,
      [customerId],
    );

    // 🚀 Fetch Completed Orders
    const [completedOrders] = await db.query(
      `SELECT o.order_id, d.dress_name as cloth_type, o.order_status as status, 
              o.tailor_id, o.order_datetime, t.shop_name, r.review_text as feedback, r.rating, o.price
       FROM orders o
       JOIN dress_types d ON o.dress_id = d.dress_id
       LEFT JOIN tailor_shop_profile t ON o.tailor_id = t.tailor_id
       LEFT JOIN reviews r ON o.order_id = r.order_id
       WHERE o.customer_id = ? AND o.order_status = 'completed'
       ORDER BY o.order_datetime DESC`,
      [customerId],
    );

    res.json({ success: true, pendingOrders, completedOrders });
  } catch (error) {
    console.error("Fetch Customer Orders Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching orders" });
  }
};
// --- SUBMIT COMPLAINT (Contact Us) ---
export const submitComplaint = async (req, res) => {
  const { customerId, email, message } = req.body;
  try {
    await db.query(
      `INSERT INTO reports (reported_by_user_id, issue_type, message) VALUES (?, ?, ?)`,
      [
        customerId,
        "Customer Support Request",
        `Email: ${email} | Message: ${message}`,
      ],
    );
    res.json({ success: true, message: "Complaint registered successfully." });
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit complaint" });
  }
};

// --- SUBMIT FEEDBACK & RATING ---
export const submitReview = async (req, res) => {
  const { orderId } = req.params;
  const { customerId, tailorId, rating, review_text } = req.body;

  try {
    // Insert the review
    await db.query(
      `INSERT INTO reviews (order_id, customer_id, tailor_id, rating, review_text) 
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, customerId, tailorId, rating, review_text],
    );

    // 🚀 Broadcast to the specific Tailor to update their Orders page
    req.io.emit("newReview", { tailorId, orderId, rating, review_text });

    // Also broadcast to update the global tailor rating average
    req.io.emit("tailorRatingUpdated", { tailorId });

    res.json({ success: true, message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ success: false, error: "Failed to submit review" });
  }
};

// --- GET TAILOR DETAILS FOR CUSTOMER APP ---
export const getTailorDetails = async (req, res) => {
  const { tailorId } = req.params;

  try {
    // 1. Get Basic Profile & Stats (Using similar logic to Tailor's Dashboard)
    const [profileRows] = await db.query(
      `SELECT t.tailor_id, t.tailor_name, t.shop_name, t.profile_photo, t.shop_photo,
              t.house_no, t.street, t.area, t.district, t.pincode, t.map_link,
              t.experience_years, t.specialization, t.availability_status, u.created_at,
              COALESCE(AVG(r.rating), 0) as averageRating,
              COUNT(DISTINCT r.review_id) as totalReviews,
              (SELECT COUNT(*) FROM orders WHERE tailor_id = t.tailor_id AND order_status = 'completed') as completedOrders
       FROM tailor_shop_profile t
       JOIN users u ON t.tailor_id = u.user_id
       LEFT JOIN reviews r ON t.tailor_id = r.tailor_id
       WHERE t.tailor_id = ?
       GROUP BY t.tailor_id`,
      [tailorId],
    );

    if (profileRows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Tailor not found" });
    const profile = profileRows[0];

    // Calculate Orders Per Day for the UI
    const createdAt = new Date(profile.created_at);
    const diffDays = Math.max(
      1,
      Math.ceil(Math.abs(new Date() - createdAt) / (1000 * 60 * 60 * 24)),
    );
    profile.ordersPerDay = (profile.completedOrders / diffDays).toFixed(1);

    // 2. Get Pricing Catalog
    const [pricing] = await db.query(
      `SELECT d.dress_id, d.dress_name as cloth_type, d.category, tp.price, tp.dress_image 
       FROM tailor_pricing tp
       JOIN dress_types d ON tp.dress_id = d.dress_id
       WHERE tp.tailor_id = ?`,
      [tailorId],
    );

    // 3. Get Recent Reviews (Limit 10 for performance)
    const [reviews] = await db.query(
      `SELECT r.rating, r.review_text, r.review_datetime, c.customer_name 
       FROM reviews r
       JOIN customer_profile c ON r.customer_id = c.customer_id
       WHERE r.tailor_id = ?
       ORDER BY r.review_datetime DESC LIMIT 10`,
      [tailorId],
    );

    res.json({ success: true, profile, pricing, reviews });
  } catch (error) {
    console.error("Fetch tailor details error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const { customerId, reason } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Attempt to insert cancellation.
    // 🚀 If > 3 hours, YOUR MySQL trigger will throw an error here and stop execution!
    await conn.query(
      `INSERT INTO order_cancellations (order_id, customer_id, reason) VALUES (?, ?, ?)`,
      [orderId, customerId, reason],
    );

    // 2. If the trigger allowed it, update the main order status
    await conn.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?`,
      [orderId],
    );

    await conn.commit();

    // 3. Notify Tailor (if a tailor had already accepted it)
    const [order] = await db.query(
      `SELECT tailor_id FROM orders WHERE order_id = ?`,
      [orderId],
    );

    if (order.length > 0 && order[0].tailor_id) {
      // 🚀 Pass the "reason" in the payload so the Tailor's app can display it
      req.io.emit("orderStatusUpdated", {
        orderId,
        status: "cancelled",
        tailorId: order[0].tailor_id,
        reason: reason, // reason for canceling the order
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully. Refund initiated.",
    });
  } catch (error) {
    await conn.rollback();

    // 🚀 Catch YOUR specific MySQL Trigger Error (State 45000)
    if (error.sqlState === "45000") {
      return res
        .status(400)
        .json({ success: false, message: error.sqlMessage });
    }

    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, error: "Failed to cancel order." });
  } finally {
    conn.release();
  }
};

// --- UPDATE THIS FUNCTION IN customer.controller.js ---
export const placeStandardOrder = async (req, res) => {
  const {
    customerId,
    tailorId,
    dress_id,
    dress_image,
    measurement_type,
    price,
    urgency,
  } = req.body;

  // 🚀 Dynamic Payment Logic: Urgent orders require upfront payment
  const paymentRequired = urgency === "normal" ? false : true;

  try {
    const [result] = await db.query(
      `INSERT INTO orders 
       (customer_id, tailor_id, urgency, measurement_type, order_status, dress_id, dress_image, price, payment_required)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        customerId,
        tailorId,
        urgency,
        measurement_type,
        dress_id,
        dress_image,
        price,
        paymentRequired,
      ],
    );

    // Instantly notify the specific tailor's app
    req.io.emit("newOrderPlaced", { tailorId });

    res.json({
      success: true,
      message: "Order placed successfully!",
      orderId: result.insertId,
    });
  } catch (error) {
    console.error("Standard Order Error:", error);
    res.status(500).json({ success: false, error: "Failed to place order." });
  }
};

// --- GET CUSTOMER's TAILOR LEDGER ---
export const getMyTailors = async (req, res) => {
  const { customerId } = req.params;

  try {
    const [tailors] = await db.query(
      `SELECT 
          t.tailor_id, 
          t.shop_name, 
          t.tailor_name,
          t.profile_photo,
          t.availability_status,
          COUNT(o.order_id) as total_orders, 
          SUM(o.price) as total_spent, 
          MAX(o.order_datetime) as last_order_date
       FROM orders o
       JOIN tailor_shop_profile t ON o.tailor_id = t.tailor_id
       WHERE o.customer_id = ? AND o.order_status = 'completed'
       GROUP BY t.tailor_id, t.shop_name, t.tailor_name, t.profile_photo, t.availability_status
       ORDER BY total_spent DESC`,
      [customerId],
    );

    // Calculate the Grand Total spent on tailoring
    const grandTotal = tailors.reduce(
      (sum, tailor) => sum + Number(tailor.total_spent || 0),
      0,
    );

    res.json({ success: true, tailors, grandTotal });
  } catch (error) {
    console.error("Fetch my tailors error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching tailors" });
  }
};
