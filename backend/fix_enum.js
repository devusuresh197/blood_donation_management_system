import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function fixEnum() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  await connection.query("ALTER TABLE blood_requests MODIFY status ENUM('Pending', 'Approved by Admin', 'Processed by Bank', 'Rejected', 'Completed') NOT NULL DEFAULT 'Pending';");
  console.log("Enum fixed");
  process.exit();
}
fixEnum().catch(console.error);
