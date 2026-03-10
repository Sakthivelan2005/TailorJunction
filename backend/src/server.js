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
import orderRoutes from "./routes/order.routes.js";
import shopDetailsRoutes from "./routes/shopDetails.js";
import tailorRoutes from "./routes/tailor.routes.js";
import tailorPricingRoutes from "./routes/tailorPricing.js";

const app = express();

// 1. PROPERLY INITIALIZE HTTP AND SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));
// Expose the 'src/images' directory to the web
app.use(
  "/images",
  express.static(path.join(process.cwd(), "src/uploads/images")),
);

// 2. INJECT 'io' INTO 'req' BEFORE ANY ROUTES ARE MOUNTED
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- SOCKET.IO CONNECTION LISTENER ---
io.on("connection", (socket) => {
  console.log("📱 A user connected:", socket.id);

  //  1. ALLOW USERS TO JOIN THEIR PRIVATE ROOMS FOR TARGETED MESSAGES
  socket.on("joinUserRoom", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room.`);
    }
  });

  // CHAT MESSAGES
  socket.on("sendMessage", (data) => {
    console.log(`💬 Message from ${data.sender_id}:`, data.message);
    io.to(data.receiver_id).emit("receiveMessage", data); //Send it directly to the receiver's private room
  });

  //  2. OPTIMIZED UBER-STYLE URGENT ORDER BROADCAST
  socket.on("requestUrgentOrder", async (data) => {
    try {
      const tempOrderId = `URG-${Date.now()}`;

      // Query the DB for Tailors who are 'available' AND have this dress_id
      const [eligibleTailors] = await db.query(
        `SELECT t.tailor_id 
         FROM tailor_shop_profile t
         JOIN tailor_pricing tp ON t.tailor_id = tp.tailor_id
         WHERE t.availability_status = 'available' 
         AND tp.dress_id = ?`,
        [data.dress_id], // Matches the dress ID sent by the customer
      );
      console.log("eligible tailor: ", eligibleTailors);
      if (eligibleTailors.length > 0) {
        console.log(
          ` Sending Urgent Order to ${eligibleTailors.length} eligible tailors.`,
        );

        // Loop through and ping ONLY the eligible tailors in their private rooms!
        eligibleTailors.forEach((tailor) => {
          io.to(tailor.tailor_id).emit("incomingUrgentOrder", {
            orderId: tempOrderId,
            ...data,
          });
        });
      } else {
        console.log("❌ No eligible tailors found for this urgent order.");
        // Optional: Ping the customer back saying no one is available
        socket.emit("noTailorsAvailable", {
          message:
            "No tailors are available for this specific dress right now.",
        });
      }
    } catch (error) {
      console.error("Error processing urgent order broadcast:", error);
    }
  });

  // FIRST TAILOR TO ACCEPT WINS
  socket.on("acceptUrgentOrder", async (acceptData) => {
    try {
      // 1. Officially insert the order into the database!
      const [result] = await db.query(
        `INSERT INTO orders 
         (customer_id, tailor_id, urgency, measurement_type, order_status, dress_id, dress_image, price, payment_required)
         VALUES (?, ?, ?, ?, 'accepted', ?, ?, ?, TRUE)`,
        [
          acceptData.customerId,
          acceptData.tailorId,
          acceptData.urgency,
          acceptData.measurement_type,
          acceptData.dress_id,
          acceptData.dress_image,
          acceptData.total_price,
        ],
      );

      const realOrderId = result.insertId;

      // 2. Tell the Customer that this specific tailor won
      io.emit("urgentOrderAccepted", {
        tempOrderId: acceptData.orderId,
        orderId: realOrderId,
        customerId: acceptData.customerId,
        tailor: {
          tailor_id: acceptData.tailorId,
          shop_name: acceptData.shop_name,
          map_link: acceptData.map_link,
        },
      });

      // 3. Tell all OTHER tailors to close their popup
      socket.broadcast.emit("closeUrgentPopup", {
        orderId: acceptData.orderId,
      });

      // 4. Force the winning Tailor's Order list to refresh instantly
      io.emit("newOrderPlaced", { tailorId: acceptData.tailorId });
    } catch (error) {
      console.error("Failed to insert urgent order:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("deleteExpiredChat", async ({ orderId }) => {
    try {
      // 🚀 FIX: Check 'completed_at' instead of 'order_datetime'
      const [orders] = await db.query(
        `SELECT completed_at FROM orders 
         WHERE order_id = ? 
         AND order_status = 'completed' 
         AND completed_at IS NOT NULL
         AND TIMESTAMPDIFF(HOUR, completed_at, NOW()) >= 24`,
        [orderId],
      );

      if (orders.length > 0) {
        await db.query(`DELETE FROM chat_messages WHERE order_id = ?`, [
          orderId,
        ]);

        // 🚀 OPTIMIZATION: Instead of global io.emit, broadcast only to users in this chat
        io.emit("chatClosed", { orderId });

        console.log(`🗑️ Deleted expired chat for Order #${orderId}`);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  });
});

// MOUNT ALL ROUTES
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

// Order routes
app.use("/api/orders", orderRoutes);

// Tailor routes
app.use("/api/tailor", tailorRoutes);
app.put("/api/tailor/:tailorId/settings/autoclose", updateAutoCloseSetting);

// Customer routes
app.use("/api/customer", customerRoutes);

// Chat Routes
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

cron.schedule("0 * * * *", async () => {
  console.log("🧹 Running Hourly Chat Cleanup Cron Job...");
  try {
    const [result] = await db.query(`
      DELETE c FROM chat_messages c
      JOIN orders o ON c.order_id = o.order_id
      WHERE o.order_status = 'completed' 
      AND TIMESTAMPDIFF(HOUR, o.order_datetime, NOW()) >= 24
    `);

    if (result.affectedRows > 0) {
      console.log(`✅ Deleted ${result.affectedRows} expired chat messages.`);
    }
  } catch (error) {
    console.error("❌ Failed to run chat cleanup cron job:", error);
  }
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
