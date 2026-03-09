import express from "express";
import {
    getMeasurements,
    updateMeasurements,
} from "../controllers/order.controller.js";

const router = express.Router();

// Make sure your server.js uses this! e.g., app.use('/api/orders', orderRoutes);
router.get("/:orderId/measurements", getMeasurements);
router.put("/:orderId/measurements", updateMeasurements);

export default router;
