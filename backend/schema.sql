-- QR Attendance System - MySQL Schema
-- Import this via phpMyAdmin: Import tab -> choose file -> Go

CREATE DATABASE IF NOT EXISTS qr_attendance;
USE qr_attendance;

-- Work shifts
CREATE TABLE shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_minutes INT DEFAULT 10
);

-- Employees (also acts as login accounts)
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(50),
  role ENUM('employee','admin') DEFAULT 'employee',
  photo_url VARCHAR(255),
  shift_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Rotating QR tokens, generated every 30-60s by the backend
CREATE TABLE qr_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  valid_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Daily attendance records
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  check_in_time DATETIME NULL,
  check_out_time DATETIME NULL,
  status ENUM('present','late','absent','half_day') DEFAULT 'present',
  check_in_token_id INT NULL,
  check_out_token_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_daily (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (check_in_token_id) REFERENCES qr_tokens(id),
  FOREIGN KEY (check_out_token_id) REFERENCES qr_tokens(id)
);

-- Seed a default shift (9:00 - 18:00, 10 min grace)
INSERT INTO shifts (name, start_time, end_time, grace_minutes)
VALUES ('Default Shift', '09:00:00', '18:00:00', 10);

-- Seed a default admin account (password: Admin@123 - CHANGE THIS)
-- Password hash below corresponds to "Admin@123" using bcrypt (generate your own in production)
-- Run backend/services/hashPassword.js to generate a real hash before using this in production.
