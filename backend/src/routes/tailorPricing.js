import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * POST /api/tailor-pricing
 * Body:
 * {
 *   tailor_id: "T00001",
 *   prices: [{ dress_id: 1, price: 450 }]
 * }
 */
router.post("/tailor-pricing", async (req, res) => {
  const { tailor_id, prices } = req.body;

  if (!tailor_id || !Array.isArray(prices) || prices.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid payload",
    });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const sql = `
      INSERT INTO tailor_pricing (tailor_id, dress_id, price)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        price = VALUES(price),
        last_updated = NOW()
    `;

    for (const item of prices) {
      await conn.execute(sql, [tailor_id, item.dress_id, item.price]);
    }

    await conn.commit();

    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Tailor pricing error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to save pricing",
    });
  } finally {
    conn.release();
  }
});

export default router;
