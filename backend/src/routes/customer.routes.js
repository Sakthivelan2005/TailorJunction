import express from "express";
import {
    cancelOrder,
    getCustomerOrders,
    getMyTailors,
    getTailorDetails,
    getTailors,
    placeOrder,
    placeStandardOrder,
    submitComplaint,
    submitReview,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/tailors", getTailors);
router.post("/order", placeOrder);
router.get("/:customerId/orders", getCustomerOrders);
router.post("/complaint", submitComplaint);
router.post("/orders/:orderId/review", submitReview);
router.get("/tailors/:tailorId/details", getTailorDetails);
router.post("/orders/:orderId/cancel", cancelOrder);
router.post("/orders", placeStandardOrder);
router.get("/:customerId/my-tailors", getMyTailors);

export default router;
