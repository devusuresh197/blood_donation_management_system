import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const sql = `
    INSERT INTO blood_stock (blood_bank_id, admin_id, blood_group, quantity, collection_date, expiry_date) VALUES 
    (1, 1, 'O+', 12, '2026-03-22', '2026-04-26'),
    (1, 1, 'A+', 25, '2026-03-25', '2026-04-28'),
    (1, 1, 'B+', 14, '2026-03-24', '2026-04-29'),
    (1, 1, 'AB-', 9, '2026-03-15', '2026-04-20'),
    (2, 1, 'O-', 8, '2026-03-20', '2026-04-20'),
    (2, 1, 'B-', 4, '2026-03-22', '2026-04-21'),
    (2, 1, 'A-', 10, '2026-03-28', '2026-04-28'),
    (3, 1, 'AB+', 11, '2026-03-25', '2026-04-30'),
    (3, 1, 'A-', 7, '2026-03-26', '2026-05-01'),
    (3, 1, 'O+', 31, '2026-03-29', '2026-05-05');
  `;

  await connection.query(sql);
  console.log("Mock inventory seeded!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
