import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS donor_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      donor_id INT NOT NULL,
      blood_bank_id INT NOT NULL,
      blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
      preferred_date DATE NOT NULL,
      request_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending Bank Review',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_dr_donor FOREIGN KEY (donor_id) REFERENCES donors(Id) ON DELETE CASCADE,
      CONSTRAINT fk_dr_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(Bank_Id) ON DELETE CASCADE
    );
  `;
  await connection.query(sql);
  console.log("donor_requests recreated successfully!");
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
