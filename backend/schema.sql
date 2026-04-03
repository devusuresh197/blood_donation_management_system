CREATE DATABASE IF NOT EXISTS blood_donation_management;
USE blood_donation_management;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS blood_requests;
DROP TABLE IF EXISTS donor_requests;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS blood_stock;
DROP TABLE IF EXISTS blood_inventory;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS blood_banks;
DROP TABLE IF EXISTS donors;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS admins (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phn_no VARCHAR(20) NOT NULL,
  password VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_banks (
  Bank_Id INT PRIMARY KEY AUTO_INCREMENT,
  bank_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  contact_no VARCHAR(20) NOT NULL,
  operating_hours VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  daily_capacity INT NOT NULL DEFAULT 2,
  status ENUM('Operational', 'Closed') NOT NULL DEFAULT 'Operational',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  donor_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  phn_no VARCHAR(20) NOT NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  address TEXT NOT NULL,
  eligibility_status ENUM('Eligible', 'Not Eligible') NOT NULL DEFAULT 'Eligible',
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipients (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  req_blood_gp ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  hospital_details TEXT NOT NULL,
  urgency_level ENUM('Low', 'Medium', 'High', 'Emergency') NOT NULL DEFAULT 'Medium',
  req_date DATE NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_stock (
  StockId INT PRIMARY KEY AUTO_INCREMENT,
  blood_bank_id INT NOT NULL,
  admin_id INT NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  collection_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  CONSTRAINT fk_stock_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(Bank_Id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_admin FOREIGN KEY (admin_id) REFERENCES admins(Id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donation_code VARCHAR(20) NOT NULL UNIQUE,
  donor_id INT NOT NULL,
  blood_bank_id INT NOT NULL,
  quantity_donated INT NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  screening_status ENUM('Screened', 'Testing', 'Rejected') NOT NULL DEFAULT 'Testing',
  CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES donors(Id) ON DELETE CASCADE,
  CONSTRAINT fk_donation_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(Bank_Id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blood_requests (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  request_code VARCHAR(20) NOT NULL UNIQUE,
  recipient_id INT NOT NULL,
  blood_bank_id INT NOT NULL,
  admin_id INT NULL,
  quantity_required INT NOT NULL DEFAULT 1,
  request_date DATE NOT NULL,
  status ENUM('Pending', 'Approved by Admin', 'Processed by Bank', 'Rejected') NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_req_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(Id) ON DELETE CASCADE,
  CONSTRAINT fk_req_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(Bank_Id) ON DELETE CASCADE,
  CONSTRAINT fk_req_admin FOREIGN KEY (admin_id) REFERENCES admins(Id) ON DELETE SET NULL
);

INSERT INTO admins (name, email, phn_no, password)
VALUES ('Super Admin', 'admin@bloodcare.com', '+91 9999999999', 'admin123');

INSERT INTO blood_banks (bank_code, name, location, contact_no, operating_hours, email, password, status)
VALUES
  ('BB01', 'RedPulse Central Bank', 'Mumbai Central', '+91 9000011111', '24/7', 'redpulse@bloodcare.com', 'bank123', 'Operational'),
  ('BB02', 'LifeStream Blood Center', 'Bengaluru South', '+91 9000022222', '8 AM - 8 PM', 'lifestream@bloodcare.com', 'bank123', 'Operational'),
  ('BB03', 'HopeLine Blood Bank', 'Hyderabad HI-TEC', '+91 9000033333', '9 AM - 6 PM', 'hopeline@bloodcare.com', 'bank123', 'Operational');

INSERT INTO donors (donor_code, name, age, gender, phn_no, blood_group, address, eligibility_status, email, password)
VALUES
  ('D001', 'Aarav Sharma', 28, 'Male', '+91 9876543210', 'O+', 'Andheri, Mumbai', 'Eligible', 'aarav@bloodcare.com', 'donor123'),
  ('D002', 'Priya Nair', 25, 'Female', '+91 9123456780', 'A-', 'Koramangala, Bengaluru', 'Not Eligible', 'priya@bloodcare.com', 'donor123');

INSERT INTO recipients (recipient_code, name, req_blood_gp, hospital_details, urgency_level, req_date, email, password)
VALUES
  ('R001', 'Karan Mehta', 'O-', 'Apollo Hospital, Ward 4', 'Emergency', '2026-04-01', 'karan@bloodcare.com', 'recipient123'),
  ('R002', 'Ananya Roy', 'A+', 'Fortis Clinic, Pune', 'High', '2026-04-02', 'ananya@bloodcare.com', 'recipient123');

INSERT INTO blood_stock (blood_bank_id, admin_id, blood_group, quantity, collection_date, expiry_date)
VALUES
  ((SELECT Bank_Id FROM blood_banks WHERE bank_code = 'BB01'), 1, 'O+', 10, '2026-03-15', '2026-04-20'),
  ((SELECT Bank_Id FROM blood_banks WHERE bank_code = 'BB01'), 1, 'A-', 5, '2026-03-20', '2026-04-25');

INSERT INTO donations (donation_code, donor_id, blood_bank_id, quantity_donated, date, screening_status)
VALUES
  ('DN01', 1, 1, 1, '2026-03-18', 'Screened');

INSERT INTO blood_requests (request_code, recipient_id, blood_bank_id, admin_id, quantity_required, request_date, status)
VALUES
  ('RQ01', 1, 1, NULL, 2, '2026-04-01', 'Pending');


DELIMITER //

CREATE TRIGGER IF NOT EXISTS check_stock_before_request
BEFORE INSERT ON blood_requests
FOR EACH ROW
BEGIN
  DECLARE total_stock INT DEFAULT 0;
  DECLARE recipient_blood_group VARCHAR(10);
  
  SELECT req_blood_gp INTO recipient_blood_group
  FROM recipients
  WHERE Id = NEW.recipient_id;
  
  SELECT COALESCE(SUM(quantity), 0) INTO total_stock 
  FROM blood_stock 
  WHERE blood_bank_id = NEW.blood_bank_id 
    AND blood_group = recipient_blood_group 
    AND expiry_date >= CURDATE();
    
  IF NEW.quantity_required > total_stock THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Insufficient blood stock. The selected bank does not have enough active units for this blood group.';
  END IF;
END;
//

DELIMITER ;



DELIMITER //

CREATE TRIGGER IF NOT EXISTS check_donor_eligibility_56_days
BEFORE INSERT ON donor_requests
FOR EACH ROW
BEGIN
  DECLARE last_donation_date DATE;
  
  SELECT MAX(date) INTO last_donation_date 
  FROM donations 
  WHERE donor_id = NEW.donor_id;
  
  IF last_donation_date IS NOT NULL THEN
    IF CURDATE() < DATE_ADD(last_donation_date, INTERVAL 56 DAY) THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Eligibility Error: Medical protocols require you to wait at least 56 days since your last completed donation before you can submit a new request.';
    END IF;
  END IF;
END;
//

DELIMITER ;



DELIMITER //

CREATE TRIGGER IF NOT EXISTS check_daily_capacity
BEFORE INSERT ON donor_requests
FOR EACH ROW
BEGIN
  DECLARE current_count INT;
  DECLARE max_cap INT;

  SELECT COUNT(*) INTO current_count 
  FROM donor_requests 
  WHERE blood_bank_id = NEW.blood_bank_id 
    AND preferred_date = NEW.preferred_date 
    AND status IN ('Pending Bank Review', 'Accepted by Blood Bank', 'Completed');

  SELECT daily_capacity INTO max_cap 
  FROM blood_banks 
  WHERE Bank_Id = NEW.blood_bank_id;

  IF current_count >= max_cap THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Capacity Error: This blood bank has reached its maximum daily appointment limit for the requested date. Please select an alternate day.';
  END IF;
END;
//

DELIMITER ;

