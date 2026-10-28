# AI-Based Employee Attendance and Salary Management System

A production-ready full-stack enterprise HR, biometric attendance, and automated payroll solution.

---

## 1. System Architecture

```text
React (Vite + Tailwind CSS)  <-- Web UI (Admin & Employee Portals, Live Webcam)
   │
   ├─► Spring Boot 3.3.x REST API (Port 8080)
   │     ├─ JWT Authentication & BCrypt Password Encryption
   │     ├─ Employee Management & Status Tracking
   │     ├─ Attendance Computation (Hours, Late Threshold, Half-Day, Overtime)
   │     ├─ Leave Workflow (Apply, Approve, Reject)
   │     ├─ Automated Payroll & Payslip Generation
   │     └─ Audit Logging & CSV Export
   │
   ├─► Python Flask AI Microservice (Port 5001)
   │     ├─ OpenCV Face Detection & Spatial ROI Feature Embeddings
   │     ├─ Biometric Face Enrollment (Multi-sample capture)
   │     └─ Real-time Recognition & Match Verification
   │
   └─► MySQL 8 Database (Docker container on port 3307 or native port 3306)
         └─ Database schema with tables: users, employees, attendances, leave_requests, salaries, audit_logs, company_rules
```

---

## 2. Technology Stack

- **Frontend**: React 18, Tailwind CSS, Vite, Axios, Recharts
- **Backend**: Java 21, Spring Boot 3.3.3, Spring Security, Spring Data JPA, JWT (JJWT), Maven 3.9
- **AI Microservice**: Python 3.11+, Flask, OpenCV (opencv-python), NumPy, Haar Cascades
- **Database**: MySQL 8.0, Docker Compose

---

## 3. Project Directory Structure

```text
Employee_Attendance/
├── backend/                 # Spring Boot API
│   ├── src/main/java/       # Controllers, Services, Repositories, Entities, Security
│   ├── src/test/java/       # Comprehensive JUnit 5 & Spring Boot test suite
│   ├── src/main/resources/  # application.yml
│   ├── mvnw.cmd             # Standalone Maven wrapper
│   └── pom.xml              # Maven dependencies
├── ai-service/              # Python Flask Face Recognition microservice
│   ├── services/            # facial_service.py (detection, embeddings, matching)
│   ├── templates/ & static/ # Biometric camera view & templates
│   ├── app.py               # Flask application entry point with CORS
│   └── test_ai_service.py   # Python unit tests
├── frontend/                # React Vite client application
│   ├── src/api/apiClient.js # Central Axios client for backend & AI microservice
│   ├── src/App.jsx          # Live Dashboard, Employee Directory, Webcam Scanner, Leaves, Salary
│   └── package.json
├── database/
│   └── schema.sql           # Complete MySQL database DDL schema and seed data
├── docker-compose.yml       # MySQL 8.0 container (mapped to host port 3307)
├── .env.example             # Environment variable template
└── README.md
```

---

## 4. Quick Start Guide (Windows)

### Step 1: Start MySQL Database

Run the provided Docker Compose file (host port mapped to `3307` to avoid conflict with native Windows MySQL on `3306`):

```powershell
docker compose up -d
```

*(Optional: If the database tables are not auto-created, import schema via PowerShell):*
```powershell
Get-Content database/schema.sql -Raw | docker exec -i employee_attendance_mysql mysql -uappuser -papppass employee_attendance_db
```

### Step 2: Start the Python AI Face Recognition Service

Open a new PowerShell terminal:

```powershell
cd D:\Employee_Attendance\ai-service
..\.venv\Scripts\activate
python app.py
```
*Service will start at `http://localhost:5001`.*

### Step 3: Start the Spring Boot Backend

Open a new PowerShell terminal:

```powershell
cd D:\Employee_Attendance\backend
.\mvnw.cmd spring-boot:run
```
*Backend will start at `http://localhost:8080`.*

### Step 4: Start the React Frontend

Open a new PowerShell terminal:

```powershell
cd D:\Employee_Attendance\frontend
npm run dev
```
*Frontend will be accessible at `http://localhost:5173`.*

---

## 5. Default Credentials

- **Admin Account**:
  - **Username**: `admin`
  - **Password**: `admin123`
  - **Role**: `ADMIN`

- **Employee Accounts**:
  - Auto-created when an employee is registered via the Employee Directory.
  - **Username**: Employee email
  - **Password**: `emp123`
  - **Role**: `EMPLOYEE`

---

## 6. Functional Features

1. **Live Face Recognition Attendance**:
   - Opens the camera via `navigator.mediaDevices.getUserMedia`.
   - Sends real-time video frames to `/api/recognize`.
   - Matches face against registered employee embeddings.
   - Automatically records Check-in (if first scan) or Check-out (if already checked in).
   - Computes working hours, late status (> 09:15 AM threshold), and overtime.

2. **Employee Face Enrollment**:
   - Allows capturing 1-3 camera samples directly inside the "Add Employee" modal.
   - Saves employee profile in MySQL and registers biometric embeddings in the AI microservice.

3. **Automated Salary Management**:
   - Computes monthly payroll using actual attendance days, approved leave deductions, and overtime pay.
   - Generates digital payslips with detailed breakdown.

4. **Leave Management Workflow**:
   - Employees apply for Casual, Sick, Annual, or Unpaid leaves.
   - Administrators review and Approve/Reject requests with audit tracking.

5. **Security & Auditing**:
   - Stateless JWT tokens.
   - BCrypt password hashing.
   - Comprehensive audit logging (`audit_logs`) tracking employee creation, salary generation, and leave decisions.
   - Formula-injection-safe CSV export for attendance logs.

---

## 7. Running Tests

### Backend Unit & Integration Tests (Spring Boot + H2 In-Memory)
```powershell
cd D:\Employee_Attendance\backend
.\mvnw.cmd test
```
*Result: 9 tests run, 0 failures, 0 errors.*

### AI Face Recognition Tests (Python Unittest)
```powershell
cd D:\Employee_Attendance\ai-service
..\.venv\Scripts\python.exe test_ai_service.py
```
*Result: 4 tests run, 0 failures.*

### Frontend Production Build Validation
```powershell
cd D:\Employee_Attendance\frontend
npm run build
```
