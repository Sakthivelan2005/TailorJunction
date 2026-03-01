import express from "express";
import db from "../db.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/shopDetails",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        tailor_id,
        tailor_name,
        shop_name,
        house_no,
        street,
        area,
        district,
        pincode,
        experience_years,
        specialization,
        availability_status,
      } = req.body;

      const profilePhotoPath = req.files?.profilePhoto
        ? `/uploads/tailors/${tailor_id}/${req.files.profilePhoto[0].filename}`
        : null;

      const shopPhotoPath = req.files?.shopPhoto
        ? `/uploads/tailors/${tailor_id}/${req.files.shopPhoto[0].filename}`
        : null;

      const sql = `
        UPDATE tailor_shop_profile SET
          tailor_name = ?,
          shop_name = ?,
          profile_photo = COALESCE(?, profile_photo),
          shop_photo = COALESCE(?, shop_photo),
          house_no = ?, street = ?, area = ?, district = ?, pincode = ?,
          experience_years = ?, specialization = ?,
          availability_status = ?
        WHERE tailor_id = ?
      `;

      await db.execute(sql, [
        tailor_name,
        shop_name,
        profilePhotoPath,
        shopPhotoPath,
        house_no,
        street,
        area,
        district,
        pincode,
        experience_years,
        specialization,
        availability_status,
        tailor_id,
      ]);

      res.json({ success: true });
    } catch (err) {
      console.error("ShopDetails Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

export default router;
