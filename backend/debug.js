require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
  console.log("--- Config Node is using ---");
  console.log("HOST:", process.env.DB_HOST);
  console.log("USER:", process.env.DB_USER);
  console.log("PASSWORD:", JSON.stringify(process.env.DB_PASSWORD));
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("-----------------------------");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [dbInfo] = await connection.query(
    "SELECT DATABASE() AS current_db, @@port AS port, @@hostname AS host_name;",
  );
  console.log("Connected to:", dbInfo[0]);

  const [tables] = await connection.query("SHOW TABLES;");
  console.log("Tables Node can see:", tables);

  await connection.end();
}

main().catch((err) => console.error("DEBUG ERROR:", err.message));
