import { Router } from "express";
import { pool } from "../config/database.js";
import { sendError } from "../utils/http.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    const { bloodGroup = "All", bank = "All", status = "All" } = request.query;
    const filters = [];
    const params = [];

    if (bloodGroup !== "All") {
      filters.push("i.blood_group = ?");
      params.push(bloodGroup);
    }

    if (bank !== "All") {
      filters.push("b.bank_code = ?");
      params.push(bank);
    }

    if (status !== "All") {
      // Status is handled differently or ignored since stock doesn't have status
      // We will skip this filter for now
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT
        MIN(s.StockId) as id,
        b.bank_code AS bankCode,
        b.name AS bankName,
        s.blood_group AS bloodGroup,
        SUM(s.quantity) AS unitsAvailable,
        NULL AS collectionDate,
        NULL AS expiryDate
      FROM blood_stock s
      INNER JOIN blood_banks b ON b.Bank_Id = s.blood_bank_id
      ${whereClause ? whereClause.replace(/i\./g, 's.') : ""}
      GROUP BY b.Bank_Id, b.bank_code, b.name, s.blood_group
      ORDER BY s.blood_group ASC`,
      params
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
