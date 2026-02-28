// backend/src/db.js
// Load .env variables FIRST
require("dotenv").config();

const mysql = require("mysql2");

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
pool
  .promise()
  .execute("SELECT 1 as connected")
  .then(() => {
    console.log("✅ MySQL Connected Successfully!");
  })
  .catch((err) => {
    console.error("❌ MySQL Connection Failed:", err.message);
  });

// Export promise version for async/await
module.exports = pool.promise();
