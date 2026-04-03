import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  const schemaPath = path.join(process.cwd(), "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Running migrations...");
  await connection.query(sql);
  console.log("Migrations applied successfully!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
