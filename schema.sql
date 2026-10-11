-- ====================================================================
-- HOSPITAL MANAGEMENT SYSTEM - POSTGRESQL DATABASE SCHEMA & SAMPLE DATA
-- Database Name: hospital_management
-- ====================================================================

-- Create Database (Run this line separately if database does not exist)
-- CREATE DATABASE hospital_management;

-- 1. DEPARTMENT
CREATE TABLE IF NOT EXISTS DEPARTMENT (
    Dept_ID SERIAL PRIMARY KEY,
    Dept_Name VARCHAR(100) NOT NULL,
    Location VARCHAR(100)
);

-- 2. DOCTOR
CREATE TABLE IF NOT EXISTS DOCTOR (
    Doctor_ID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100),
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Dept_ID INT REFERENCES DEPARTMENT(Dept_ID) ON DELETE SET NULL
);

-- 3. PATIENT
CREATE TABLE IF NOT EXISTS PATIENT (
    Patient_ID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    DOB DATE,
    Gender VARCHAR(10),
    Phone VARCHAR(20),
    Address TEXT,
    Email VARCHAR(100)
);

-- 4. APPOINTMENT
CREATE TABLE IF NOT EXISTS APPOINTMENT (
    Appt_ID SERIAL PRIMARY KEY,
    Appt_Date DATE NOT NULL,
    Appt_Time TIME NOT NULL,
    Reason VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'SCHEDULED',
    Doctor_ID INT REFERENCES DOCTOR(Doctor_ID) ON DELETE CASCADE,
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE
);

-- 5. MEDICAL_RECORD
CREATE TABLE IF NOT EXISTS MEDICAL_RECORD (
    Record_ID SERIAL PRIMARY KEY,
    Diagnosis TEXT,
    Treatment TEXT,
    Record_Date DATE DEFAULT CURRENT_DATE,
    Notes TEXT,
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE,
    Doctor_ID INT REFERENCES DOCTOR(Doctor_ID) ON DELETE CASCADE
);

-- 6. PRESCRIPTION
CREATE TABLE IF NOT EXISTS PRESCRIPTION (
    Prescription_ID SERIAL PRIMARY KEY,
    Prescription_Date DATE DEFAULT CURRENT_DATE,
    Instructions TEXT,
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE,
    Doctor_ID INT REFERENCES DOCTOR(Doctor_ID) ON DELETE CASCADE
);

-- 7. MEDICINE
CREATE TABLE IF NOT EXISTS MEDICINE (
    Medicine_ID SERIAL PRIMARY KEY,
    Medicine_Name VARCHAR(100) NOT NULL,
    Price NUMERIC(10, 2),
    Dosage VARCHAR(50),
    Stock INT DEFAULT 0
);

-- 8. PRESCRIPTION_MEDICINE (Composite Primary Key)
CREATE TABLE IF NOT EXISTS PRESCRIPTION_MEDICINE (
    Prescription_ID INT REFERENCES PRESCRIPTION(Prescription_ID) ON DELETE CASCADE,
    Medicine_ID INT REFERENCES MEDICINE(Medicine_ID) ON DELETE CASCADE,
    Quantity INT DEFAULT 1,
    PRIMARY KEY (Prescription_ID, Medicine_ID)
);

-- 9. LAB_TEST
CREATE TABLE IF NOT EXISTS LAB_TEST (
    Test_ID SERIAL PRIMARY KEY,
    Test_Name VARCHAR(100) NOT NULL,
    Test_Date DATE DEFAULT CURRENT_DATE,
    Result TEXT,
    Status VARCHAR(50) DEFAULT 'PENDING',
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE
);

-- 10. ROOM
CREATE TABLE IF NOT EXISTS ROOM (
    Room_ID SERIAL PRIMARY KEY,
    Room_Number VARCHAR(20) NOT NULL UNIQUE,
    Room_Type VARCHAR(50),
    Ward VARCHAR(50)
);

-- 11. ADMISSION
CREATE TABLE IF NOT EXISTS ADMISSION (
    Admission_ID SERIAL PRIMARY KEY,
    Admission_Date DATE DEFAULT CURRENT_DATE,
    Discharge_Date DATE,
    Status VARCHAR(50) DEFAULT 'ADMITTED',
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE,
    Room_ID INT REFERENCES ROOM(Room_ID) ON DELETE CASCADE
);

-- 12. BILLING
CREATE TABLE IF NOT EXISTS BILLING (
    Bill_ID SERIAL PRIMARY KEY,
    Bill_Date DATE DEFAULT CURRENT_DATE,
    Service_Details TEXT,
    Amount NUMERIC(10, 2) NOT NULL,
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE
);

-- 13. PAYMENT
CREATE TABLE IF NOT EXISTS PAYMENT (
    Payment_ID SERIAL PRIMARY KEY,
    Payment_Date DATE DEFAULT CURRENT_DATE,
    Amount NUMERIC(10, 2) NOT NULL,
    Payment_Method VARCHAR(50),
    Status VARCHAR(50) DEFAULT 'COMPLETED',
    Bill_ID INT REFERENCES BILLING(Bill_ID) ON DELETE CASCADE
);

-- 14. INSURANCE
CREATE TABLE IF NOT EXISTS INSURANCE (
    Insurance_ID SERIAL PRIMARY KEY,
    Provider_Name VARCHAR(100) NOT NULL,
    Policy_Number VARCHAR(100),
    Coverage_Details TEXT,
    Validity DATE,
    Patient_ID INT REFERENCES PATIENT(Patient_ID) ON DELETE CASCADE
);

-- 15. STAFF
CREATE TABLE IF NOT EXISTS STAFF (
    Staff_ID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50),
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Dept_ID INT REFERENCES DEPARTMENT(Dept_ID) ON DELETE SET NULL
);

-- 16. USER_LOGIN (Staff_ID UNIQUE 1:1)
CREATE TABLE IF NOT EXISTS USER_LOGIN (
    User_ID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Staff_ID INT UNIQUE REFERENCES STAFF(Staff_ID) ON DELETE CASCADE
);


-- ====================================================================
-- SAMPLE INITIAL DATA FOR TESTING
-- ====================================================================

-- Departments
INSERT INTO DEPARTMENT (Dept_Name, Location) VALUES
('Cardiology', 'Building A, 1st Floor'),
('Neurology', 'Building B, 2nd Floor'),
('Pediatrics', 'Building C, 1st Floor'),
('Orthopedics', 'Building A, 3rd Floor'),
('General Surgery', 'Building B, 4th Floor')
ON CONFLICT DO NOTHING;

-- Doctors
INSERT INTO DOCTOR (Name, Specialization, Phone, Email, Dept_ID) VALUES
('Dr. Sarah Jenkins', 'Cardiology', '+1 555-0101', 'sarah.jenkins@apexcare.org', 1),
('Dr. Michael Chen', 'Neurology', '+1 555-0102', 'michael.chen@apexcare.org', 2),
('Dr. Emily Rodriguez', 'Pediatrics', '+1 555-0103', 'emily.rodriguez@apexcare.org', 3),
('Dr. James Wilson', 'Orthopedics', '+1 555-0104', 'james.wilson@apexcare.org', 4),
('Dr. Priya Patel', 'General Surgery', '+1 555-0105', 'priya.patel@apexcare.org', 5)
ON CONFLICT DO NOTHING;

-- Patients
INSERT INTO PATIENT (Name, DOB, Gender, Phone, Address, Email) VALUES
('Eleanor Brooks', '1981-04-12', 'Female', '+1 555-0201', '742 Evergreen Terrace', 'eleanor.b@example.com'),
('Robert Hawkins', '1964-08-25', 'Male', '+1 555-0202', '123 Elm Street', 'robert.h@example.com'),
('Sophia Martinez', '2018-02-14', 'Female', '+1 555-0203', '456 Oak Lane', 'sophia.m@example.com'),
('David Anderson', '1992-11-30', 'Male', '+1 555-0204', '789 Maple Drive', 'david.a@example.com')
ON CONFLICT DO NOTHING;

-- Rooms
INSERT INTO ROOM (Room_Number, Room_Type, Ward) VALUES
('101', 'General Ward', 'East Wing'),
('102', 'General Ward', 'East Wing'),
('201-ICU', 'ICU', 'Critical Care'),
('301-VIP', 'VIP Suite', 'West Wing')
ON CONFLICT DO NOTHING;

-- Appointments
INSERT INTO APPOINTMENT (Appt_Date, Appt_Time, Reason, Status, Doctor_ID, Patient_ID) VALUES
('2026-10-15', '09:30:00', 'Routine Cardiac Checkup', 'COMPLETED', 1, 1),
('2026-10-15', '11:00:00', 'Neurology Consultation', 'SCHEDULED', 2, 2),
('2026-10-15', '13:45:00', 'Pediatric Fever Evaluation', 'PENDING', 3, 3),
('2026-10-15', '14:30:00', 'Orthopedic Knee Joint Assessment', 'COMPLETED', 4, 4)
ON CONFLICT DO NOTHING;

-- Medicines
INSERT INTO MEDICINE (Medicine_Name, Price, Dosage, Stock) VALUES
('Amoxicillin 500mg', 12.50, '1 capsule 3x daily', 150),
('Atorvastatin 20mg', 25.00, '1 tablet nightly', 200),
('Lisinopril 10mg', 18.00, '1 tablet daily', 180),
('Paracetamol 500mg', 5.00, 'As needed for fever', 500)
ON CONFLICT DO NOTHING;

-- Billing
INSERT INTO BILLING (Bill_Date, Service_Details, Amount, Patient_ID) VALUES
('2026-10-15', 'Cardiology Consultation & ECG Test', 250.00, 1),
('2026-10-15', 'Neurology MRI Scan & Consultation', 750.00, 2)
ON CONFLICT DO NOTHING;

-- Payments
INSERT INTO PAYMENT (Payment_Date, Amount, Payment_Method, Status, Bill_ID) VALUES
('2026-10-15', 250.00, 'CREDIT_CARD', 'COMPLETED', 1)
ON CONFLICT DO NOTHING;

-- Staff
INSERT INTO STAFF (Name, Role, Phone, Email, Dept_ID) VALUES
('Dr. Alex Morgan', 'CHIEF_ADMINISTRATOR', '+1 555-0001', 'alex.morgan@apexcare.org', 1),
('Nurse Sarah Connor', 'HEAD_NURSE', '+1 555-0002', 'sarah.connor@apexcare.org', 1)
ON CONFLICT DO NOTHING;

-- User Login (Username: admin, Password: password123)
INSERT INTO USER_LOGIN (Username, Password, Staff_ID) VALUES
('admin', 'password123', 1)
ON CONFLICT DO NOTHING;
