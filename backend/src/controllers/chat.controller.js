import db from "../db.js";

// Fetch chat history for an order
export const getChatHistory = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [messages] = await db.query(
      `SELECT * FROM chat_messages WHERE order_id = ? ORDER BY sent_at ASC`,
      [orderId],
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Fetch chat error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch chat history" });
  }
};

// Save a new message
export const saveMessage = async (req, res) => {
  const { order_id, sender_id, receiver_id, message } = req.body;
  try {
    await db.query(
      `INSERT INTO chat_messages (order_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
      [order_id, sender_id, receiver_id, message],
    );
    res.json({ success: true, message: "Message saved" });
  } catch (error) {
    console.error("Save message error:", error);
    res.status(500).json({ success: false, message: "Failed to save message" });
  }
};
