import db from "../db.js";

// --- GET EXISTING MEASUREMENTS ---
export const getMeasurements = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT measurements FROM orders WHERE order_id = ?`,
      [orderId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // MySQL mysql2 driver automatically parses JSON columns into objects!
    res.json({ success: true, measurements: rows[0].measurements || {} });
  } catch (error) {
    console.error("Error fetching measurements:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- UPDATE MEASUREMENTS & EMIT SOCKET ---
export const updateMeasurements = async (req, res) => {
  const { orderId } = req.params;
  const { measurements } = req.body; // This is the full JS object from frontend

  try {
    // Convert the JS object to a JSON string for MySQL storage
    const jsonString = JSON.stringify(measurements);

    await db.query(`UPDATE orders SET measurements = ? WHERE order_id = ?`, [
      jsonString,
      orderId,
    ]);

    // Instantly notify anyone looking at this order that measurements changed!
    req.io.emit("measurementsUpdated", {
      orderId: Number(orderId),
      measurements: measurements,
    });

    res.json({ success: true, message: "Measurements updated successfully" });
  } catch (error) {
    console.error("Error updating measurements:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
