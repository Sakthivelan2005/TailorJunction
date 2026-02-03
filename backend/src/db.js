const mysql = require("mysql2");

// Create a connection pool (better for performance than a single connection)
const pool = mysql.createPool({
  host: "127.0.0.1", // Replace with your DB host if not local
  user: "root", // Your MySQL Workbench username
  password: "1234", // Your MySQL Workbench password
  database: "ecommerce", // Name of the schema created in Workbench
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the pool to use it in other files
module.exports = pool.promise();
