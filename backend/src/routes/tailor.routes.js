import express from "express";
import {
    addNewCustomDress,
    getDashboardData,
    getOrders,
    getProfile,
    getSettings,
    getTailorCustomers,
    updateAutoCloseSetting,
    updateAvailability,
    updateOrderStatus,
    updateTailorPricing,
} from "../controllers/tailor.controller.js";
import { uploadDressImage } from "../middleware/upload.js";

const router = express.Router();

router.get("/:tailorId/dashboard", getDashboardData);
router.get("/:tailorId/orders", getOrders);
router.get("/:tailorId/profile", getProfile);
router.get("/:tailorId/settings", getSettings);
router.put("/:tailorId/status", updateAvailability);
router.put("/:tailorId/auto-close", updateAutoCloseSetting);
router.get("/:tailorId/customers", getTailorCustomers);
router.put("/orders/:orderId/status", updateOrderStatus);
// Ensure multer is set up to handle 'dressImage' field uploads
router.put("/:tailorId/pricing", updateTailorPricing);
// Notice how the name 'dressImage' matches exactly what you appended in the Frontend FormData
router.post(
  "/:tailorId/custom-dress",
  uploadDressImage.single("dressImage"),
  addNewCustomDress,
);
export default router;
