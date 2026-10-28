CREATE DATABASE IF NOT EXISTS employee_attendance_db;
USE employee_attendance_db;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'EMPLOYEE') NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    department VARCHAR(100),
    designation VARCHAR(100),
    joining_date DATE,
    monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    working_hours_per_day INT DEFAULT 8,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    face_embedding TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE company_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_start_time TIME NOT NULL,
    company_end_time TIME NOT NULL,
    required_working_hours INT NOT NULL,
    late_threshold_minutes INT NOT NULL,
    half_day_threshold_minutes INT NOT NULL,
    overtime_threshold_minutes INT NOT NULL,
    working_days_per_month INT NOT NULL,
    paid_leave_days INT NOT NULL,
    unpaid_leave_days INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE attendances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in DATETIME,
    check_out DATETIME,
    working_hours DECIMAL(5,2) DEFAULT 0.00,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL,
    late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY unique_attendance_per_day (employee_id, attendance_date)
);

CREATE TABLE leave_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    leave_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_leave_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE salaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    salary_month INT NOT NULL,
    salary_year INT NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    payable_days DECIMAL(5,2) DEFAULT 0.00,
    paid_leave_days DECIMAL(5,2) DEFAULT 0.00,
    unpaid_leave_days DECIMAL(5,2) DEFAULT 0.00,
    overtime_amount DECIMAL(10,2) DEFAULT 0.00,
    deductions DECIMAL(10,2) DEFAULT 0.00,
    bonus DECIMAL(10,2) DEFAULT 0.00,
    final_salary DECIMAL(10,2) DEFAULT 0.00,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY unique_salary_month (employee_id, salary_month, salary_year)
);

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_id BIGINT,
    actor_name VARCHAR(150),
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id BIGINT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE complaints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    admin_note TEXT,
    resolved_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaint_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_complaint_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
);

INSERT INTO company_rules (
    company_start_time,
    company_end_time,
    required_working_hours,
    late_threshold_minutes,
    half_day_threshold_minutes,
    overtime_threshold_minutes,
    working_days_per_month,
    paid_leave_days,
    unpaid_leave_days
) VALUES (
    '09:00:00',
    '18:00:00',
    8,
    15,
    240,
    60,
    26,
    10,
    5
);

INSERT INTO users (username, password, role) VALUES ('admin', '$2a$10$8qWSL6gVQ7tE76A7tE9SgOc4lskGfZSR6V8Lx6zQmDgZrZfO1w0P2', 'ADMIN');
