import { Router } from "express";
import { pool } from "../config/database.js";
import { buildSearchClause, sendError } from "../utils/http.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    const { search = "", bloodGroup = "All", bank = "All", status = "All", donor } = request.query;
    const filters = [];
    const params = [];

    if (donor) {
      filters.push("d.donor_code = ?");
      params.push(donor);
    }

    if (bloodGroup !== "All") {
      filters.push("d.blood_group = ?");
      params.push(bloodGroup);
    }
    if (bank !== "All") {
      filters.push("b.bank_code = ?");
      params.push(bank);
    }
    if (status !== "All") {
      filters.push("dn.screening_status = ?");
      params.push(status);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "dn.donation_code",
      "d.name",
      "b.name",
      "d.blood_group",
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;

    const [rows] = await pool.query(
      `SELECT
        dn.id as id,
        dn.donation_code AS idCode,
        d.donor_code AS donorCode,
        d.name AS donorName,
        b.bank_code AS bankCode,
        b.name AS bankName,
        d.blood_group AS bloodGroup,
        dn.quantity_donated AS units,
        dn.date AS donationDate,
        dn.screening_status as status
      FROM donations dn
      INNER JOIN donors d ON d.Id = dn.donor_id
      INNER JOIN blood_banks b ON b.Bank_Id = dn.blood_bank_id
      ${whereClause}
      ORDER BY dn.date DESC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
