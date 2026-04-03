export const donors = [
  { id: "D001", name: "Aarav Sharma", bloodGroup: "O+", gender: "Male", age: 28, city: "Mumbai", contact: "+91 9876543210", lastDonation: "2026-02-11", healthStatus: "Fit", status: "Eligible" },
  { id: "D002", name: "Priya Nair", bloodGroup: "A-", gender: "Female", age: 25, city: "Bengaluru", contact: "+91 9123456780", lastDonation: "2026-01-19", healthStatus: "Low Hemoglobin", status: "Cooling Period" },
  { id: "D003", name: "Rohan Das", bloodGroup: "B+", gender: "Male", age: 31, city: "Kolkata", contact: "+91 9988776655", lastDonation: "2025-11-20", healthStatus: "Fit", status: "Eligible" },
  { id: "D004", name: "Sneha Patel", bloodGroup: "AB+", gender: "Female", age: 29, city: "Ahmedabad", contact: "+91 9090909090", lastDonation: "2026-03-05", healthStatus: "Under Observation", status: "Under Review" }
];

export const recipients = [
  { id: "R001", name: "Karan Mehta", bloodGroup: "O-", condition: "Emergency Surgery", city: "Delhi", contact: "+91 8012345678", unitsNeeded: 2, status: "Pending" },
  { id: "R002", name: "Ananya Roy", bloodGroup: "A+", condition: "Thalassemia", city: "Pune", contact: "+91 8098765432", unitsNeeded: 1, status: "Approved" },
  { id: "R003", name: "Vikram Singh", bloodGroup: "B-", condition: "Accident Trauma", city: "Jaipur", contact: "+91 8787878787", unitsNeeded: 3, status: "Critical" }
];

export const bloodBanks = [
  { id: "BB01", name: "RedPulse Central Bank", city: "Mumbai", contact: "+91 9000011111", manager: "Dr. Isha Kapoor", capacity: 480, availableUnits: 324, status: "Operational" },
  { id: "BB02", name: "LifeStream Blood Center", city: "Bengaluru", contact: "+91 9000022222", manager: "Dr. Aman Verma", capacity: 390, availableUnits: 210, status: "Low Stock" },
  { id: "BB03", name: "HopeLine Blood Bank", city: "Hyderabad", contact: "+91 9000033333", manager: "Dr. Nidhi Rao", capacity: 420, availableUnits: 356, status: "Operational" }
];

export const inventory = [
  { group: "A+", units: 48, threshold: 20, status: "Healthy" },
  { group: "A-", units: 12, threshold: 16, status: "Low" },
  { group: "B+", units: 33, threshold: 18, status: "Healthy" },
  { group: "B-", units: 10, threshold: 14, status: "Low" },
  { group: "AB+", units: 16, threshold: 10, status: "Healthy" },
  { group: "AB-", units: 7, threshold: 8, status: "Critical" },
  { group: "O+", units: 52, threshold: 22, status: "Healthy" },
  { group: "O-", units: 9, threshold: 15, status: "Critical" }
];

export const donations = [
  { id: "DN01", donor: "Aarav Sharma", bank: "RedPulse Central Bank", bloodGroup: "O+", units: 1, date: "2026-03-18", status: "Screened" },
  { id: "DN02", donor: "Sneha Patel", bank: "HopeLine Blood Bank", bloodGroup: "AB+", units: 1, date: "2026-03-12", status: "Stored" },
  { id: "DN03", donor: "Rohan Das", bank: "LifeStream Blood Center", bloodGroup: "B+", units: 2, date: "2026-03-08", status: "Testing" }
];

export const requests = [
  { id: "RQ01", recipient: "Karan Mehta", bloodGroup: "O-", bank: "RedPulse Central Bank", units: 2, urgency: "Emergency", status: "Pending" },
  { id: "RQ02", recipient: "Ananya Roy", bloodGroup: "A+", bank: "LifeStream Blood Center", units: 1, urgency: "Medium", status: "Completed" },
  { id: "RQ03", recipient: "Vikram Singh", bloodGroup: "B-", bank: "HopeLine Blood Bank", units: 3, urgency: "High", status: "Rejected" },
  { id: "RQ04", recipient: "Karan Mehta", bloodGroup: "O-", bank: "RedPulse Central Bank", units: 1, urgency: "Emergency", status: "Accepted" }
];

export const notifications = [
  "O- inventory is below safety threshold at RedPulse Central Bank.",
  "Three new donor registrations need admin review.",
  "Recipient request RQ03 has been escalated for critical handling."
];

export const donorAccounts = [
  { email: "aarav@bloodcare.com", password: "donor123", donorId: "D001" },
  { email: "priya@bloodcare.com", password: "donor123", donorId: "D002" },
  { email: "rohan@bloodcare.com", password: "donor123", donorId: "D003" },
  { email: "sneha@bloodcare.com", password: "donor123", donorId: "D004" }
];

export const recipientAccounts = [
  { email: "karan@bloodcare.com", password: "recipient123", recipientId: "R001" },
  { email: "ananya@bloodcare.com", password: "recipient123", recipientId: "R002" },
  { email: "vikram@bloodcare.com", password: "recipient123", recipientId: "R003" }
];

export const bloodBankAccounts = [
  { email: "redpulse@bloodcare.com", password: "bank123", bankId: "BB01" },
  { email: "lifestream@bloodcare.com", password: "bank123", bankId: "BB02" },
  { email: "hopeline@bloodcare.com", password: "bank123", bankId: "BB03" }
];

export const donorRequests = [
  {
    id: "DR01",
    donorName: "Aarav Sharma",
    bloodGroup: "O+",
    bank: "RedPulse Central Bank",
    preferredDate: "2026-04-05",
    requestType: "Donation Slot Request",
    status: "Pending Bank Review"
  },
  {
    id: "DR02",
    donorName: "Priya Nair",
    bloodGroup: "A-",
    bank: "LifeStream Blood Center",
    preferredDate: "2026-04-07",
    requestType: "Emergency Donation Offer",
    status: "Accepted by Blood Bank"
  },
  {
    id: "DR03",
    donorName: "Rohan Das",
    bloodGroup: "B+",
    bank: "HopeLine Blood Bank",
    preferredDate: "2026-04-06",
    requestType: "Camp Registration",
    status: "Pending Bank Review"
  }
];
