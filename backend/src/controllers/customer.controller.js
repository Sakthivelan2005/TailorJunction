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
    const [orders] = await db.query(
      `
      SELECT 
        o.order_id, o.order_status, o.tailor_id, o.urgency, o.order_datetime,
        t.shop_name, t.profile_photo, t.area,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as tailor_rating
      FROM orders o
      JOIN tailor_shop_profile t ON o.tailor_id = t.tailor_id
      LEFT JOIN reviews r ON t.tailor_id = r.tailor_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_datetime DESC
    `,
      [customerId],
    );
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
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
