import { Router } from "express";
import { pool } from "../config/database.js";
import { buildSearchClause, sendError } from "../utils/http.js";

const router = Router();
const recipientStatuses = ["Pending", "Approved by Admin", "Processed by Bank", "Rejected"];

router.get("/recipient", async (request, response) => {
  try {
    const { search = "", bloodGroup = "All", bank = "All", status = "All", urgency = "All", recipient } = request.query;
    const filters = [];
    const params = [];

    if (recipient) {
      filters.push("r.recipient_code = ?");
      params.push(recipient);
    }

    if (bloodGroup !== "All") {
      filters.push("r.req_blood_gp = ?");
      params.push(bloodGroup);
    }
    if (bank !== "All") {
      filters.push("b.bank_code = ?");
      params.push(bank);
    }
    if (status !== "All") {
      filters.push("br.status = ?");
      params.push(status);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "r.name",
      "b.name",
      "r.req_blood_gp",
      "br.status"
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;

    const [rows] = await pool.query(
      `SELECT
        br.Id as id,
        CONCAT('RQ', br.Id) AS idCode,
        r.recipient_code AS recipientCode,
        r.name AS recipientName,
        b.bank_code AS bankCode,
        b.name AS bankName,
        r.req_blood_gp AS bloodGroup,
        br.quantity_required AS units,
        r.urgency_level AS urgency,
        br.status,
        '' AS notes,
        br.request_date AS createdAt
      FROM blood_requests br
      INNER JOIN recipients r ON r.Id = br.recipient_id
      INNER JOIN blood_banks b ON b.Bank_Id = br.blood_bank_id
      ${whereClause}
      ORDER BY br.request_date DESC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

router.get("/donor", async (request, response) => {
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
      filters.push("dr.status = ?");
      params.push(status);
    }

    const { clause: searchClause, params: searchParams } = buildSearchClause(search, [
      "d.name",
      "b.name",
      "dr.request_type",
      "dr.status"
    ]);

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")} ${searchClause}` : `WHERE 1=1 ${searchClause}`;

    const [rows] = await pool.query(
      `SELECT
        dr.id,
        CONCAT('DR', dr.id) AS idCode,
        d.donor_code AS donorCode,
        d.name AS donorName,
        b.bank_code AS bankCode,
        b.name AS bankName,
        d.blood_group AS bloodGroup,
        dr.preferred_date AS preferredDate,
        dr.request_type AS requestType,
        dr.status,
        dr.created_at AS createdAt
      FROM donor_requests dr
      INNER JOIN donors d ON d.Id = dr.donor_id
      INNER JOIN blood_banks b ON b.Bank_Id = dr.blood_bank_id
      ${whereClause}
      ORDER BY dr.created_at DESC`,
      [...params, ...searchParams]
    );

    response.json({ success: true, data: rows });
  } catch (error) {
    sendError(response, error);
  }
});

router.post("/recipient", async (request, response) => {
  try {
    const { recipientCode, bankCode, bloodGroup, units, urgency, notes = "" } = request.body;

    if (!recipientCode || !bankCode || !bloodGroup || !units || !urgency) {
      return response.status(400).json({ success: false, message: "recipientCode, bankCode, bloodGroup, units, and urgency are required" });
    }

    const [[recipient]] = await pool.query("SELECT Id FROM recipients WHERE recipient_code = ? LIMIT 1", [recipientCode]);
    const [[bank]] = await pool.query("SELECT Bank_Id as id FROM blood_banks WHERE bank_code = ? LIMIT 1", [bankCode]);

    if (!recipient || !bank) {
      return response.status(404).json({ success: false, message: "Recipient or blood bank not found" });
    }

    const [[maxRow]] = await pool.query("SELECT MAX(Id) AS maxId FROM blood_requests");
    const nextId = (maxRow.maxId || 0) + 1;
    const requestCode = `RQ${String(nextId).padStart(3, "0")}`;

    await pool.query(
      `INSERT INTO blood_requests
        (request_code, recipient_id, blood_bank_id, quantity_required, request_date, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [requestCode, recipient.Id, bank.id, Number(units), new Date().toISOString().slice(0, 10)]
    );

    response.status(201).json({ success: true, message: "Recipient request created successfully" });
  } catch (error) {
    sendError(response, error);
  }
});

router.post("/donor", async (request, response) => {
  try {
    const { donorCode, bankCode, bloodGroup, preferredDate, requestType } = request.body;

    if (!donorCode || !bankCode || !bloodGroup || !preferredDate || !requestType) {
      return response.status(400).json({ success: false, message: "donorCode, bankCode, bloodGroup, preferredDate, and requestType are required" });
    }

    const [[donor]] = await pool.query("SELECT Id FROM donors WHERE donor_code = ? LIMIT 1", [donorCode]);
    const [[bank]] = await pool.query("SELECT Bank_Id as id FROM blood_banks WHERE bank_code = ? LIMIT 1", [bankCode]);

    if (!donor || !bank) {
      return response.status(404).json({ success: false, message: "Donor or blood bank not found" });
    }

    await pool.query(
      `INSERT INTO donor_requests
        (donor_id, blood_bank_id, preferred_date, request_type, status)
       VALUES (?, ?, ?, ?, 'Pending Bank Review')`,
      [donor.Id, bank.id, preferredDate, requestType]
    );

    response.status(201).json({ success: true, message: "Donor request created successfully" });
  } catch (error) {
    sendError(response, error);
  }
});

router.patch("/recipient/:requestCode/status", async (request, response) => {
  try {
    const { requestCode } = request.params; 
    const { status } = request.body;
    
    // We get requestCode from ID 
    const Request_id = String(requestCode).replace('RQ', '');

    const [[currentReq]] = await pool.query(`
      SELECT br.status, br.blood_bank_id, r.req_blood_gp AS blood_group, br.quantity_required 
      FROM blood_requests br
      INNER JOIN recipients r ON r.Id = br.recipient_id
      WHERE br.Id = ?`, [Request_id]
    );
    
    if (!currentReq) {
      return response.status(404).json({ success: false, message: "Recipient request not found" });
    }

    // Ensure we do not deduct stock twice if it's already Completed!
    if (status === "Completed" && currentReq.status !== "Completed") {
       const [batches] = await pool.query(
         "SELECT StockId, quantity FROM blood_stock WHERE blood_bank_id = ? AND blood_group = ? AND quantity > 0 ORDER BY expiry_date ASC", 
         [currentReq.blood_bank_id, currentReq.blood_group]
       );

       let remainingToDeduct = currentReq.quantity_required;

       for (const batch of batches) {
         if (remainingToDeduct <= 0) break;
         
         const deductedFromBatch = Math.min(batch.quantity, remainingToDeduct);
         await pool.query("UPDATE blood_stock SET quantity = quantity - ? WHERE StockId = ?", [deductedFromBatch, batch.StockId]);
         
         remainingToDeduct -= deductedFromBatch;
       }
    }

    await pool.query(
      "UPDATE blood_requests SET status = ? WHERE Id = ?",
      [status, Request_id]
    );

    response.json({ success: true, message: "Recipient request status updated", requestCode, status });
  } catch (error) {
    sendError(response, error);
  }
});

router.patch("/donor/:requestCode/status", async (request, response) => {
  try {
    const { requestCode } = request.params;
    const { status, units = 1 } = request.body;
    const donorReqId = String(requestCode).replace('DR', '');

    const [[currentReq]] = await pool.query(`
      SELECT dr.status, dr.blood_bank_id, d.blood_group, dr.donor_id 
      FROM donor_requests dr
      INNER JOIN donors d ON d.Id = dr.donor_id
      WHERE dr.id = ?`, [donorReqId]
    );
    if (!currentReq) {
      return response.status(404).json({ success: false, message: "Donor request not found" });
    }

    if (status === "Completed" && currentReq.status !== "Completed") {
       await pool.query(`
         INSERT INTO blood_stock (blood_bank_id, blood_group, quantity, collection_date, expiry_date)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 42 DAY))`,
         [currentReq.blood_bank_id, currentReq.blood_group, Number(units)]
       );
       
       const [[maxDonRow]] = await pool.query("SELECT MAX(id) AS maxId FROM donations");
       const nextDonId = (maxDonRow.maxId || 0) + 1;
       const donCode = `DN${String(nextDonId).padStart(3, "0")}`;

       await pool.query(`
         INSERT INTO donations (donation_code, donor_id, blood_bank_id, quantity_donated, date, screening_status)
         VALUES (?, ?, ?, ?, CURDATE(), 'Screened')`,
         [donCode, currentReq.donor_id, currentReq.blood_bank_id, Number(units)]
       );
    }

    await pool.query(
      "UPDATE donor_requests SET status = ? WHERE id = ?",
      [status, donorReqId]
    );

    response.json({ success: true, message: "Donor request status updated", requestCode, status });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
