import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function applyTrigger() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log("Dropping existing capacity trigger...");
  await connection.query(`DROP TRIGGER IF EXISTS check_daily_capacity;`);

  console.log("Creating capacity trigger...");
  const sql = `
    CREATE TRIGGER check_daily_capacity
    BEFORE INSERT ON donor_requests
    FOR EACH ROW
    BEGIN
      DECLARE current_count INT;
      DECLARE max_cap INT;

      SELECT COUNT(*) INTO current_count 
      FROM donor_requests 
      WHERE blood_bank_id = NEW.blood_bank_id 
        AND preferred_date = NEW.preferred_date 
        AND status IN ('Pending Bank Review', 'Accepted by Blood Bank', 'Completed');

      SELECT daily_capacity INTO max_cap 
      FROM blood_banks 
      WHERE Bank_Id = NEW.blood_bank_id;

      IF current_count >= max_cap THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Capacity Error: This blood bank has reached its maximum daily appointment limit for the requested date. Please select an alternate day.';
      END IF;
    END;
  `;
  await connection.query(sql);
  
  console.log("Capacity rule trigger created successfully!");
  process.exit(0);
}
applyTrigger().catch(e => { console.error(e); process.exit(1); });
