// backend/src/db.js
// Load .env variables FIRST
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

// Use process.env from .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecommerce",
  port: process.env.PORT || 3306, // ✅ Added PORT
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// TEST CONNECTION
try {
  const connection = await pool.getConnection();
  await connection.query("SELECT 1");
  connection.release();
  console.log("MySQL Connected Successfully!");
} catch (err) {
  console.error("MySQL Connection Failed:", err.message);
}

// Export promise version for async/await
export default pool;
