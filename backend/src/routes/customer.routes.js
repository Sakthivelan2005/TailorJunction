import express from "express";
import {
    getCustomerOrders,
    getTailors,
    placeOrder,
    submitComplaint,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/tailors", getTailors);
router.post("/order", placeOrder);
router.get("/:customerId/orders", getCustomerOrders);
router.post("/complaint", submitComplaint);

export default router;
