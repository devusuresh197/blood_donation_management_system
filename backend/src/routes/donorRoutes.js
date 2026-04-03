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
      filters.push("d.blood_group = ?");
      params.push(bloodGroup);
    }

    if (status !== "All") {
      filters.push("d.eligibility_status = ?");
      params.push(status);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "d.donor_code",
      "d.name",
      "d.blood_group",
      "d.address",
      "d.phn_no",
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;
    const [rows] = await pool.query(
      `SELECT
        d.Id as id,
        d.donor_code AS idCode,
        d.name,
        d.gender,
        d.age,
        d.blood_group AS bloodGroup,
        d.address as city,
        d.phn_no as contact,
        d.email,
        d.eligibility_status AS status
      FROM donors d
      ${whereClause}
      ORDER BY d.Id DESC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

router.get("/eligibility/:donorCode", async (request, response) => {
  try {
    const { donorCode } = request.params;
    const [rows] = await pool.query(
      `SELECT donor_code, name, age, eligibility_status
       FROM donors WHERE donor_code = ? LIMIT 1`,
      [donorCode]
    );

    if (!rows.length) {
      return response.status(404).json({ success: false, message: "Donor not found" });
    }

    const donor = rows[0];

    response.json({
      success: true,
      data: {
        donorCode: donor.donor_code,
        name: donor.name,
        recordedStatus: donor.eligibility_status,
        eligibility: donor.eligibility_status,
        reason: "Derived directly from backend eligibility status.",
        daysSinceDonation: 0,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
