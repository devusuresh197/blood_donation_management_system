import { Router } from "express";
import { pool } from "../config/database.js";
import { buildSearchClause, sendError } from "../utils/http.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    const { search = "", location = "All", status = "All" } = request.query;
    const filters = [];
    const params = [];

    if (location !== "All") {
      filters.push("b.location = ?");
      params.push(location);
    }

    if (status !== "All") {
      filters.push("b.status = ?");
      params.push(status);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "b.bank_code",
      "b.name",
      "b.location",
      "b.contact_no",
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;

    const [rows] = await pool.query(
      `SELECT
        b.Bank_Id as id,
        b.bank_code AS idCode,
        b.name,
        b.location AS city,
        b.contact_no AS contact,
        b.email,
        b.operating_hours,
        b.status,
        (SELECT COALESCE(SUM(quantity), 0) FROM blood_stock s WHERE s.blood_bank_id = b.Bank_Id) AS availableUnits
      FROM blood_banks b
      ${whereClause}
      ORDER BY b.name ASC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

router.get("/:bankCode/summary", async (request, response) => {
  try {
    const { bankCode } = request.params;

    const [[bank]] = await pool.query(
      `SELECT b.Bank_Id, b.bank_code AS bankCode, b.name, b.location AS city, b.status,
        (SELECT COALESCE(SUM(quantity), 0) FROM blood_stock s WHERE s.blood_bank_id = b.Bank_Id) AS availableUnits
       FROM blood_banks b WHERE b.bank_code = ? LIMIT 1`,
      [bankCode]
    );

    if (!bank) {
      return response.status(404).json({ success: false, message: "Blood bank not found" });
    }

    const [[counts]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM blood_requests br WHERE br.blood_bank_id = ? AND br.status = 'Pending') AS pendingRecipientRequests,
        (SELECT COUNT(*) FROM donor_requests dr WHERE dr.blood_bank_id = ? AND dr.status = 'Pending Bank Review') AS pendingDonorRequests,
        (SELECT COALESCE(SUM(quantity), 0) FROM blood_stock WHERE blood_bank_id = ? AND expiry_date >= CURDATE()) AS availableUnits,
        (SELECT COUNT(*) FROM donations dn WHERE dn.blood_bank_id = ?) AS totalDonations`,
      [bank.Bank_Id, bank.Bank_Id, bank.Bank_Id, bank.Bank_Id]
    );

    response.json({ success: true, data: { ...bank, ...counts } });
  } catch (error) {
    sendError(response, error);
  }
});

router.get("/:bankCode/booked-dates", async (request, response) => {
  try {
    const { bankCode } = request.params;
    
    const [[bank]] = await pool.query("SELECT Bank_Id, daily_capacity FROM blood_banks WHERE bank_code = ?", [bankCode]);
    if (!bank) return response.status(404).json({ success: false, message: "Bank not found" });

    const [rows] = await pool.query(
      `SELECT preferred_date as date, COUNT(*) as count 
       FROM donor_requests 
       WHERE blood_bank_id = ? AND status IN ('Pending Bank Review', 'Accepted by Blood Bank')
       GROUP BY preferred_date 
       HAVING count >= ?`,
      [bank.Bank_Id, bank.daily_capacity]
    );

    const bookedDates = rows.map(r => new Date(r.date).toISOString().slice(0, 10));
    response.json({ success: true, bookedDates });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
