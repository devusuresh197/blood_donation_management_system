import { Router } from "express";
import { pool } from "../config/database.js";
import { sendError } from "../utils/http.js";
import { z } from "zod";

const router = Router();

const donorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(65, "Must be 65 or younger"),
  gender: z.enum(["Male", "Female", "Other"]),
  phn_no: z.string().min(10, "Contact must be valid"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  address: z.string().min(2, "Address is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const recipientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  req_blood_gp: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  hospital_details: z.string().min(2, "Hospital details are required"),
  urgency_level: z.enum(["Low", "Medium", "High", "Emergency"]),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const authTables = {
  donor: {
    table: "donors",
    idField: "donor_code",
    select: "Id as id, donor_code AS code, name, email, blood_group AS bloodGroup, address, eligibility_status AS status",
  },
  recipient: {
    table: "recipients",
    idField: "recipient_code",
    select: "Id as id, recipient_code AS code, name, email, req_blood_gp AS bloodGroup, hospital_details, urgency_level",
  },
  bloodBank: {
    table: "blood_banks",
    idField: "bank_code",
    select: "Bank_Id as id, bank_code AS code, name, email, location, operating_hours, status",
  },
  admin: {
    table: "admins",
    idField: "Id",
    select: "Id as id, name, email, phn_no",
  }
};

router.post("/login", async (request, response) => {
  try {
    const { role, email, password } = request.body;

    if (!role || !email || !password || !authTables[role]) {
      return response.status(400).json({ success: false, message: "role, email, and password are required" });
    }

    const { table, select } = authTables[role];
    const [rows] = await pool.query(
      `SELECT ${select}, password FROM ${table} WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length || rows[0].password !== password) {
      return response.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const { password: _password, ...user } = rows[0];
    response.json({ success: true, role, user });
  } catch (error) {
    sendError(response, error);
  }
});

router.post("/register/donor", async (request, response) => {
  try {
    const parsed = donorSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }

    const { name, age, gender, phn_no, bloodGroup, address, email, password } = parsed.data;

    const [[existing]] = await pool.query("SELECT Id FROM donors WHERE email = ? LIMIT 1", [email]);
    if (existing) {
      return response.status(409).json({ success: false, message: "A donor with this email already exists" });
    }

    const [[maxRow]] = await pool.query("SELECT MAX(Id) AS maxId FROM donors");
    const nextId = (maxRow.maxId || 0) + 1;
    const donorCode = `D${String(nextId).padStart(3, "0")}`;

    await pool.query(
      `INSERT INTO donors
        (donor_code, name, age, gender, phn_no, blood_group, address, eligibility_status, email, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Eligible', ?, ?)`,
      [donorCode, name, age, gender, phn_no, bloodGroup, address, email, password]
    );

    const [[created]] = await pool.query(
      `SELECT Id as id, donor_code AS code, name, email, blood_group AS bloodGroup, address, eligibility_status AS status
       FROM donors WHERE donor_code = ? LIMIT 1`,
      [donorCode]
    );

    response.status(201).json({ success: true, role: "donor", user: created });
  } catch (error) {
    sendError(response, error);
  }
});

router.post("/register/recipient", async (request, response) => {
  try {
    const parsed = recipientSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }

    const { name, req_blood_gp, hospital_details, urgency_level, email, password } = parsed.data;

    const [[existing]] = await pool.query("SELECT Id FROM recipients WHERE email = ? LIMIT 1", [email]);
    if (existing) {
      return response.status(409).json({ success: false, message: "A recipient with this email already exists" });
    }

    const [[maxRow]] = await pool.query("SELECT MAX(Id) AS maxId FROM recipients");
    const nextId = (maxRow.maxId || 0) + 1;
    const recipientCode = `R${String(nextId).padStart(3, "0")}`;
    const req_date = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO recipients
        (recipient_code, name, req_blood_gp, hospital_details, urgency_level, req_date, email, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipientCode, name, req_blood_gp, hospital_details, urgency_level, req_date, email, password]
    );

    const [[created]] = await pool.query(
      `SELECT Id as id, recipient_code AS code, name, email, req_blood_gp AS bloodGroup, hospital_details, urgency_level
       FROM recipients WHERE recipient_code = ? LIMIT 1`,
      [recipientCode]
    );

    response.status(201).json({ success: true, role: "recipient", user: created });
  } catch (error) {
    sendError(response, error);
  }
});

export default router;
