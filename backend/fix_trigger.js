import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function fixTrigger() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log("Dropping existing inventory protection trigger...");
  await connection.query(`DROP TRIGGER IF EXISTS check_stock_before_request;`);

  console.log("Creating strict API-normalized inventory protection trigger...");
  const sql = `
    CREATE TRIGGER check_stock_before_request
    BEFORE INSERT ON blood_requests
    FOR EACH ROW
    BEGIN
      DECLARE total_stock INT DEFAULT 0;
      DECLARE recipient_blood_group VARCHAR(10);
      
      SELECT req_blood_gp INTO recipient_blood_group
      FROM recipients
      WHERE Id = NEW.recipient_id;
      
      SELECT COALESCE(SUM(quantity), 0) INTO total_stock 
      FROM blood_stock 
      WHERE blood_bank_id = NEW.blood_bank_id 
        AND blood_group = recipient_blood_group 
        AND expiry_date >= CURDATE();
        
      IF NEW.quantity_required > total_stock THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Insufficient blood stock. The selected bank does not have enough active units for this blood group.';
      END IF;
    END;
  `;
  await connection.query(sql);
  
  console.log("Inventory Trigger patched successfully!");
  process.exit(0);
}
fixTrigger().catch(e => { console.error(e); process.exit(1); });
