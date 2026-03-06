// backend/src/server.js
import cors from "cors";
import express from "express";
import http from "http";
import cron from "node-cron";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import {
  checkPhoneExists,
  loginUser,
  signup,
  verifyOtp,
} from "./controllers/auth.controller.js";
import { getChatHistory, saveMessage } from "./controllers/chat.controller.js";
import { updateAutoCloseSetting } from "./controllers/tailor.controller.js";
import db from "./db.js";
import customerRoutes from "./routes/customer.routes.js";
import dressTypesRoutes from "./routes/dressTypes.js";
import shopDetailsRoutes from "./routes/shopDetails.js";
import tailorRoutes from "./routes/tailor.routes.js";
import tailorPricingRoutes from "./routes/tailorPricing.js";

const app = express();

// 🚀 1. PROPERLY INITIALIZE HTTP AND SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));

// 🚀 2. INJECT 'io' INTO 'req' BEFORE ANY ROUTES ARE MOUNTED
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- SOCKET.IO CONNECTION LISTENER ---
io.on("connection", (socket) => {
  console.log("📱 A user connected:", socket.id);
  // 🚀 LISTEN FOR INCOMING CHAT MESSAGES AND BROADCAST THEM
  socket.on("sendMessage", (data) => {
    // data contains: order_id, sender_id, receiver_id, message
    console.log("💬 Chat message sent:", data);

    // Instantly emit the message to everyone (the frontend filters by order_id)
    io.emit("receiveMessage", data);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// 🚀 3. MOUNT ALL ROUTES
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend LIVE!" });
});

// Auth routes
app.post("/api/login", loginUser);
app.post("/api/signup", signup);
app.post("/api/verify-otp", verifyOtp);
app.post("/api/check-phone", checkPhoneExists);

app.use("/api", dressTypesRoutes);
app.use("/api", shopDetailsRoutes);
app.use("/api", tailorPricingRoutes);

app.use("/api/tailor", tailorRoutes);
app.put("/api/tailor/:tailorId/settings/autoclose", updateAutoCloseSetting);

// Customer routes
app.use("/api/customer", customerRoutes);

//Chat Routes
app.get("/api/chat/:orderId", getChatHistory);
app.post("/api/chat", saveMessage);

// Cron Job for 11:00 PM auto-close
cron.schedule(
  "0 23 * * *",
  async () => {
    console.log("⏰ Running 11:00 PM Auto-Close Cron Job...");
    try {
      const [result] = await db.query(`
            UPDATE tailor_shop_profile 
            SET availability_status = 'unavailable' 
            WHERE availability_status = 'available' 
            AND is_auto_close_enabled = TRUE
        `);
      console.log(
        `✅ Automatically closed ${result.affectedRows} opted-in tailor shops.`,
      );

      // Optional: Tell all customers to refresh if the cron job closed shops
      if (result.affectedRows > 0) {
        io.emit("bulkStatusUpdate");
      }
    } catch (error) {
      console.error("❌ Failed to run auto-close cron job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  },
);

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
