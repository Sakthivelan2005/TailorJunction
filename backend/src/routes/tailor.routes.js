import express from "express";
import {
    getDashboardData,
    getOrders,
    getProfile,
    getSettings,
    updateAutoCloseSetting,
    updateAvailability,
} from "../controllers/tailor.controller.js";

const router = express.Router();

router.get("/:tailorId/dashboard", getDashboardData);
router.get("/:tailorId/orders", getOrders);
router.get("/:tailorId/profile", getProfile);
router.get("/:tailorId/settings", getSettings);
router.put("/:tailorId/status", updateAvailability);
router.put("/:tailorId/auto-close", updateAutoCloseSetting);

export default router;
