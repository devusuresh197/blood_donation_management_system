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

  console.log("Dropping existing trigger if any...");
  await connection.query(`DROP TRIGGER IF EXISTS check_donor_eligibility_56_days;`);

  console.log("Creating 56-day rule trigger...");
  const sql = `
    CREATE TRIGGER check_donor_eligibility_56_days
    BEFORE INSERT ON donor_requests
    FOR EACH ROW
    BEGIN
      DECLARE last_donation_date DATE;
      
      SELECT MAX(date) INTO last_donation_date 
      FROM donations 
      WHERE donor_id = NEW.donor_id;
      
      IF last_donation_date IS NOT NULL THEN
        IF CURDATE() < DATE_ADD(last_donation_date, INTERVAL 56 DAY) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Eligibility Error: Medical protocols require you to wait at least 56 days since your last completed donation before you can submit a new request.';
        END IF;
      END IF;
    END;
  `;
  await connection.query(sql);
  
  console.log("56-day Eligibility Trigger created successfully!");
  process.exit(0);
}
applyTrigger().catch(e => { console.error(e); process.exit(1); });
