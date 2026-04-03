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
  await connection.query(`DROP TRIGGER IF EXISTS check_stock_before_request;`);

  console.log("Creating new blood stock validation trigger...");
  const sql = `
    CREATE TRIGGER check_stock_before_request
    BEFORE INSERT ON blood_requests
    FOR EACH ROW
    BEGIN
      DECLARE total_stock INT DEFAULT 0;
      
      SELECT COALESCE(SUM(quantity), 0) INTO total_stock 
      FROM blood_stock 
      WHERE blood_bank_id = NEW.blood_bank_id 
        AND blood_group = NEW.blood_group 
        AND expiry_date >= CURDATE();
        
      IF NEW.quantity_required > total_stock THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Insufficient blood stock. The selected bank does not have enough active units for this blood group.';
      END IF;
    END;
  `;
  await connection.query(sql);
  
  console.log("Trigger 'check_stock_before_request' created successfully!");
  process.exit(0);
}
applyTrigger().catch(e => { console.error(e); process.exit(1); });
