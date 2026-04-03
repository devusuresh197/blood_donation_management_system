# Blood Donation Backend

This backend uses `Express` and `MySQL` for the Blood Donation Management System.

## Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Update the MySQL credentials in `backend/.env`
3. Run the SQL in `backend/schema.sql`
4. Install dependencies with `npm install`
5. Start the API with `npm run server`

## Main endpoints

- `POST /api/auth/login`
- `GET /api/donors`
- `GET /api/donors/eligibility/:donorCode`
- `GET /api/recipients`
- `GET /api/recipients/search-banks?bloodGroup=O-&city=All&limit=3`
- `GET /api/blood-banks`
- `GET /api/blood-banks/:bankCode/summary`
- `GET /api/inventory`
- `GET /api/donations`
- `GET /api/requests/recipient`
- `GET /api/requests/donor`

## Demo role logins

- Recipient: `karan@bloodcare.com` / `recipient123`
- Donor: `aarav@bloodcare.com` / `donor123`
- Blood Bank: `redpulse@bloodcare.com` / `bank123`
