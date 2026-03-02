// backend/src/routes/dressTypes.js
import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/dress-types", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT dress_id, category, dress_name, dress_image, base_price FROM dress_types",
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
