import { Router } from "express";
import { pool } from "../config/database.js";
import { buildSearchClause, sendError } from "../utils/http.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    const { search = "", bloodGroup = "All", city = "All", status = "All" } = request.query;
    const filters = [];
    const params = [];

    if (bloodGroup !== "All") {
      filters.push("r.req_blood_gp = ?");
      params.push(bloodGroup);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "r.recipient_code",
      "r.name",
      "r.req_blood_gp",
      "r.hospital_details"
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;
    const [rows] = await pool.query(
      `SELECT
        r.Id as id,
        r.recipient_code AS idCode,
        r.name,
        r.req_blood_gp AS bloodGroup,
        r.hospital_details AS conditionName,
        r.urgency_level AS urgency,
        r.req_date AS createdAt
      FROM recipients r
      ${whereClause}
      ORDER BY r.req_date DESC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

router.get("/search-banks", async (request, response) => {
  try {
    const { bloodGroup, city = "All" } = request.query;

    if (!bloodGroup) {
      return response.status(400).json({ success: false, message: "bloodGroup is required" });
    }

    const [rows] = await pool.query(
      `SELECT
        b.bank_code AS bankCode,
        b.name,
        b.location as city,
        b.contact_no as contact,
        s.blood_group AS bloodGroup,
        SUM(s.quantity) AS unitsAvailable,
        'Operational' as status,
        TRUE as recommended
      FROM blood_stock s
      INNER JOIN blood_banks b ON b.Bank_Id = s.blood_bank_id
      WHERE s.blood_group = ? 
      GROUP BY b.Bank_Id, b.bank_code, b.name, b.location, b.contact_no, s.blood_group
      HAVING SUM(s.quantity) > 0
      ORDER BY unitsAvailable DESC, b.name ASC`,
      [bloodGroup]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
