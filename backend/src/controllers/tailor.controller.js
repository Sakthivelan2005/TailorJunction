import db from "../db.js";

// 1. DASHBOARD & PROFILE DATA

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

export const getProfile = async (req, res) => {
  const { tailorId } = req.params;

  try {
    const [profileDetails] = await db.query(
      `SELECT t.tailor_name, t.shop_name, u.phone, u.email, 
              t.house_no, t.street, t.area, t.district, t.map_link, t.state, t.pincode, t.profile_photo
       FROM tailor_shop_profile t
       JOIN users u ON t.tailor_id = u.user_id
       WHERE t.tailor_id = ?`,
      [tailorId],
    );

    // 🚀 Added tp.updated_at so the frontend can calculate the 24hr timer
    const [pricing] = await db.query(
      `SELECT tp.dress_id, d.dress_name as cloth_type, d.base_price, tp.price, tp.dress_image, tp.last_updated as updated_at 
       FROM tailor_pricing tp
       JOIN dress_types d ON tp.dress_id = d.dress_id
       WHERE tp.tailor_id = ?`,
      [tailorId],
    );

    if (profileDetails.length === 0)
      return res.status(404).json({ message: "Tailor not found" });

    res.json({ details: profileDetails[0], pricing });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

// 2. ORDER MANAGEMENT

export const getOrders = async (req, res) => {
  const { tailorId } = req.params;

  try {
    // Fetch Pending Orders
    const [pendingOrders] = await db.query(
      `
      SELECT o.order_id, d.dress_name as cloth_type, o.order_status as status, 
       o.customer_id, o.urgency, o.order_datetime
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
      SELECT o.order_id, d.dress_name as cloth_type, r.review_text as feedback, r.rating, o.order_datetime as completed_at 
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

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'accepted', 'completed', etc.

  try {
    if (status == "completed") {
      await db.query(
        `UPDATE orders SET order_status = 'completed', completed_at = NOW() WHERE order_id = ?;`,
        [orderId],
      );
    } else {
      //update when accepted
      await db.query(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [
        status,
        orderId,
      ]);
    }
    // Instantly tell the customer their order progress bar should move!
    req.io.emit("orderStatusUpdated", { orderId: Number(orderId), status });

    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update order status" });
  }
};

// 3. SETTINGS & AVAILABILITY

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

// 4. CATALOG & PRICING
export const updateTailorPricing = async (req, res) => {
  const { tailorId } = req.params;
  const { pricingUpdates } = req.body;

  try {
    for (const item of pricingUpdates) {
      await db.query(
        `UPDATE tailor_pricing tp
         JOIN dress_types dt ON tp.dress_id = dt.dress_id
         SET tp.price = GREATEST(?, dt.base_price)
         WHERE tp.tailor_id = ? AND tp.dress_id = ?`,
        [item.new_price, tailorId, item.dress_id],
      );
    }

    req.io.emit("catalogUpdated", { tailorId });
    res.json({ success: true, message: "Pricing updated securely." });
  } catch (error) {
    // 🚀 Catch the custom MySQL Trigger Error!
    if (error.code === "ER_SIGNAL_EXCEPTION" || error.sqlState === "45000") {
      return res.status(400).json({
        success: false,
        message:
          error.sqlMessage ||
          "Price cannot be updated within 24 hours of last update.",
      });
    }

    console.error("Pricing Update Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update pricing." });
  }
};

export const addNewCustomDress = async (req, res) => {
  const { tailorId } = req.params;
  const { dress_name, category, price } = req.body;
  const requestedPrice = Number(price);

  // 🚀 The URL will now be perfectly clean: /images/women/Green_Chudi.png
  const catLower = category ? category.toLowerCase() : "misc";
  const dress_image = req.file
    ? `/images/${catLower}/${req.file.filename}`
    : null;

  try {
    // 1. Check if dress exists globally
    const [existingDress] = await db.query(
      `SELECT dress_id, base_price FROM dress_types WHERE LOWER(dress_name) = LOWER(?)`,
      [dress_name],
    );

    let finalDressId;

    if (existingDress.length > 0) {
      // SCENARIO A: Dress exists.
      finalDressId = existingDress[0].dress_id;

      if (requestedPrice < existingDress[0].base_price) {
        return res.status(400).json({
          success: false,
          message: `Price cannot be less than base price of ₹${existingDress[0].base_price}`,
        });
      }
    } else {
      // 🚀 SCENARIO B: Brand new dress!
      // Insert into dress_types WITH the newly generated dress_image URL
      const [newDress] = await db.query(
        `INSERT INTO dress_types (dress_name, category, base_price, dress_image) VALUES (?, ?, ?, ?)`,
        [dress_name, category, requestedPrice, dress_image],
      );
      finalDressId = newDress.insertId;
    }

    // 2. Also insert/update into tailor_pricing
    await db.query(
      `INSERT INTO tailor_pricing (tailor_id, dress_id, price, dress_image) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price), dress_image = VALUES(dress_image)`,
      [tailorId, finalDressId, requestedPrice, dress_image],
    );

    req.io.emit("catalogUpdated", { tailorId });
    res.json({ success: true, message: "Dress added successfully!" });
  } catch (error) {
    console.error("Add custom dress error:", error);
    res.status(500).json({ success: false, error: "Failed to add dress." });
  }
};

// --- GET TAILOR'S CUSTOMER LEDGER ---
export const getTailorCustomers = async (req, res) => {
  const { tailorId } = req.params;

  try {
    const [customers] = await db.query(
      `SELECT 
          c.customer_id, 
          c.customer_name, 
          c.area, 
          u.phone,
          COUNT(o.order_id) as total_orders, 
          SUM(o.price) as total_spent, 
          MAX(o.order_datetime) as last_order_date,
          GROUP_CONCAT(d.dress_name SEPARATOR ', ') as stitched_dresses
       FROM orders o
       JOIN customer_profile c ON o.customer_id = c.customer_id
       JOIN users u ON c.customer_id = u.user_id
       JOIN dress_types d ON o.dress_id = d.dress_id
       WHERE o.tailor_id = ? AND o.order_status = 'completed'
       GROUP BY c.customer_id, c.customer_name, c.area, u.phone
       ORDER BY total_spent DESC`,
      [tailorId],
    );

    // Calculate the Grand Total earned from all customers
    const grandTotal = customers.reduce(
      (sum, cust) => sum + Number(cust.total_spent || 0),
      0,
    );

    res.json({ success: true, customers, grandTotal });
  } catch (error) {
    console.error("Fetch tailor customers error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching customers" });
  }
};
