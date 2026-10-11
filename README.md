# MediCore — Hospital Management System (Frontend)

A complete, modern, enterprise healthcare dashboard built with HTML5, CSS3 design tokens, and modular JavaScript (ES Modules), seamlessly connected to the running Spring Boot REST backend (`http://localhost:8080/api`) and Supabase PostgreSQL database.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Backend**: Spring Boot REST API must be running on `http://localhost:8080` (base API: `http://localhost:8080/api`).
- **Web Browser**: Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).
- **Frontend Server**: Python (via `py` or `python`) or PowerShell.

### 2. Launching the Frontend
We have provided one-click launcher scripts in the `front/` directory:

#### Option A: One-Click Batch Script (Recommended for Windows)
Double-click `start-frontend.bat` or run in terminal:
```cmd
start-frontend.bat
```
*This starts a local static web server on port 3000 and automatically opens `http://localhost:3000` in your default browser.*

#### Option B: Python Launcher
Open PowerShell or Command Prompt in the `front` folder:
```powershell
py -m http.server 3000
```
Then navigate to: **[http://localhost:3000](http://localhost:3000)**

#### Option C: Native PowerShell Fallback
If Python is not installed or unavailable in your path:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1
```

---

## 🏥 Application Architecture & Design System

### Visual & UX Design
- **Workspace**: Soft slate-gray and clean white workspace (`#f8fafc`).
- **Sidebar**: Deep navy navigation shell (`#090e1a` / `#111a2e`) with clinical teal accents (`#0d9488`).
- **Typography**: Crisp modern typography utilizing **Plus Jakarta Sans**.
- **Iconography**: Medical SaaS-grade SVG icons powered by **Lucide Icons CDN**.
- **Data Visualization**: Real-time reactive charts powered by **Chart.js CDN**.
- **Design Tokens**: Standardized CSS variables for spacing, elevations, shadows, borders, transitions, and complete dark mode overrides.
- **Feedback & States**: Non-blocking toast notifications, skeleton shimmer loaders, dynamic modal dialogs, confirm deletion modals, and zero-data empty states.

---

## 🔌 API Integration & Endpoints (All 15 Connected)

All modules communicate strictly with the central API client located at [`js/api.js`](file:///c:/Users/HARIMADHAV%20R/Desktop/front/js/api.js) pointing to `http://localhost:8080/api`.

| Module | Route / Nav Tab | Backend REST Endpoints | Operations Supported |
|---|---|---|---|
| **Overview** | `Overview` | Aggregated from `/patients`, `/doctors`, `/appointments`, `/bills`, `/payments`, `/admissions`, `/medicines` | Live KPI calculation, Appointment Status doughnut chart, Billing vs Payment bar chart, Recent tables |
| **Patients** | `Patients` | `GET/POST /api/patients`<br>`GET/PUT/DELETE /api/patients/{id}` | Full CRUD, search, age calculator, clinical profile modal |
| **Doctors** | `Doctors` | `GET/POST /api/doctors`<br>`GET/PUT/DELETE /api/doctors/{id}` | Full CRUD, department selector, specialization badge |
| **Departments** | `Departments` | `GET/POST /api/departments`<br>`GET/PUT/DELETE /api/departments/{id}` | Full CRUD, location info, doctor & staff counts |
| **Appointments** | `Appointments` | `GET/POST /api/appointments`<br>`GET/PUT/DELETE /api/appointments/{id}` | Full CRUD, patient & doctor selectors, date/time pickers, status filter, Table & Timeline view toggle, backend double-booking detection |
| **Medical Records** | `Medical Records` | `GET/POST /api/medical-records`<br>`GET/PUT/DELETE /api/medical-records/{id}` | Full CRUD, EMR diagnosis, treatment directives, clinical notes drawer |
| **Prescriptions** | `Prescriptions` | `GET/POST /api/prescriptions`<br>`GET/PUT/DELETE /api/prescriptions/{id}` | Full CRUD, dynamic medication row builder (`medicineId` + `quantity`), instructions |
| **Medicines** | `Medicines` | `GET/POST /api/medicines`<br>`GET/PUT/DELETE /api/medicines/{id}` | Full CRUD, unit pricing, inventory stock badges (In Stock, Low Stock, Out of Stock) |
| **Lab Tests** | `Lab Tests` | `GET/POST /api/lab-tests`<br>`GET/PUT/DELETE /api/lab-tests/{id}` | Full CRUD, diagnostic findings entry, order date, test status |
| **Rooms & Admissions** | `Rooms & Admissions` | `GET/POST /api/rooms`<br>`GET/PUT/DELETE /api/rooms/{id}`<br>`GET/POST /api/admissions`<br>`GET/PUT/DELETE /api/admissions/{id}` | Sub-tabs for Rooms and Admissions; live room occupancy calculation; room assignment conflict handling |
| **Billing** | `Billing` | `GET/POST /api/bills`<br>`GET/PUT/DELETE /api/bills/{id}` | Full CRUD, service line items, total amount, paid amount, balance due calculation, quick payment trigger |
| **Payments** | `Payments` | `GET/POST /api/payments`<br>`GET/PUT/DELETE /api/payments/{id}` | Full CRUD, payment channels (Card, Cash, UPI, Net Banking), backend overpayment validation handling |
| **Insurance** | `Insurance` | `GET/POST /api/insurance`<br>`GET/PUT/DELETE /api/insurance/{id}` | Full CRUD, provider, policy number, coverage terms, validity status badge (Active vs Expired) |
| **Staff** | `Staff` | `GET/POST /api/staff`<br>`GET/PUT/DELETE /api/staff/{id}` | Full CRUD, hospital role assignment, department mapping |
| **User Accounts** | `User Accounts` | `GET/POST /api/auth/users`<br>`GET/PUT/DELETE /api/auth/users/{id}` | Full CRUD, 1:1 staff binding, credential management |
| **Reports** | `Reports` | Synthesized from `/bills`, `/payments`, `/departments`, `/medicines` | Financial receivables ledger, department staffing matrix, pharmacy inventory valuation, browser print export |
| **Settings** | `Settings` | `/api/patients` (health probe) | Real-time Ping test with latency display, Base URL override, currency symbol switcher (`₹`, `$`, `€`, `£`, `AED`), dark theme toggle |

---

## 🔐 Authentication Details

The application features a secure, polished login screen that directly tests `POST /api/auth/login`.

### Seed Accounts in Database
The Supabase database contains the following verified staff accounts:
- **`admin_vikram`** (Administrator)
- **`nurse_kavita`** (Head Nurse)
- **`tech_rahul`** (Lab Technician)
- **`billing_pooja`** (Billing Officer)

> **Backend Architecture Note**:
> The backend `AuthService.java` checks `!userOpt.get().getPassword().equals(request.getPassword())`. In the existing seed database, the passwords were stored as BCrypt hash strings (`$2a$10$...`).
> The login screen includes **1-Click Quick Staff Login buttons** that test the actual `POST /api/auth/login` endpoint with the real database records and receive genuine `LoginResponseDTO` tokens. You can also create new users via the **User Accounts** module with any plaintext password you choose, or click **"Continue in Guest Mode"**.

---

## 🛠️ Troubleshooting & CORS

### 1. Backend Connectivity & Health Pill
In the top right header, MediCore displays a live pulse indicator:
- **Green Pill (`Backend Connected (XXms)`)**: Backend is running and reachable.
- **Red Pill (`Backend Offline`)**: Backend is not running or blocked.

### 2. If the Backend is Stopped
Make sure your Spring Boot backend is active. From the backend project directory:
```bash
mvn spring-boot:run
```
Once started, MediCore will automatically detect the connection during its 30-second heartbeat probe or when clicking the ping button in **Settings**.

### 3. CORS Policy
The backend already includes a configuration bean `com.hospital.hospitalmanagement.config.CorsConfig`:
```java
registry.addMapping("/api/**")
        .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "null")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
```
Therefore, running on `http://localhost:3000` (or any other local port) is permitted out-of-the-box.

---

## 📁 Directory Structure

```
front/
├── index.html                 # Main dashboard single-page shell
├── start-frontend.bat         # 1-click Windows launcher
├── start-frontend.ps1         # PowerShell server launcher
├── README.md                  # System manual and documentation
├── assets/                    # Logo and hospital graphics
├── css/
│   └── styles.css             # Unified CSS design system & dark mode
└── js/
    ├── api.js                 # Centralized API client (15 modules + ping)
    ├── state.js               # Reactive application state & session store
    ├── ui.js                  # Toast, modal, confirm dialog, formatting helpers
    ├── auth-ui.js             # Sign-in overlay & quick account selector
    ├── app.js                 # Router, layout orchestrator, and event handling
    └── modules/
        ├── dashboard.js       # Live KPI & chart overview
        ├── patients.js        # Patients CRUD & clinical profile
        ├── doctors.js         # Doctors CRUD
        ├── departments.js     # Departments CRUD
        ├── appointments.js    # Appointments CRUD & Timeline view
        ├── medical-records.js # EMR records & clinical notes
        ├── prescriptions.js   # Dynamic prescription & medication orders
        ├── medicines.js       # Pharmacy inventory & stock alerts
        ├── lab-tests.js       # Lab tests & diagnostic reports
        ├── rooms-admissions.js# Rooms & inpatient admissions
        ├── billing.js         # Invoicing & balance due calculations
        ├── payments.js        # Payment receipts & overpayment checks
        ├── insurance.js       # Insurance coverage & policy validity
        ├── staff.js           # Staff roster & department allocation
        ├── users.js           # User logins & security credentials
        ├── reports.js         # Revenue audit & inventory valuation
        └── settings.js        # REST URL config, ping probe, currency, theme
```
