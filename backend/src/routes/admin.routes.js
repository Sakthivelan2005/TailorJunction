import express from "express";
import {
    addDressType,
    adminLogin,
    adminSignup,
    deleteDressType,
    getDashboardData,
    getPendingTailors,
    verifyTailor,
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Public Route (Login)
router.post("/login", adminLogin);
router.post("/signup", adminSignup);

// Protected Routes (Require Admin JWT Token)
router.get("/tailors/pending", verifyAdmin, getPendingTailors);
router.post("/tailors/verify", verifyAdmin, verifyTailor);

router.post("/dresses", verifyAdmin, addDressType);
router.delete("/dresses/:id", verifyAdmin, deleteDressType);

router.get("/dashboard", verifyAdmin, getDashboardData);

export default router;
