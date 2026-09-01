# 🚚 Transport CRM — Fleet, Consignment & Logistics Management System

A production-grade, full-stack **Transport & Logistics CRM** built as a final year college project. The system handles fleet operations, customer directory, driver dispatch, consignment status workflows, automated invoicing with **Razorpay Test Mode**, real-time **WhatsApp Cloud API** event alerts, and live **Recharts** logistics analytics.

---

## 🌟 Zero-Cost Architecture (100% Free Tiers, No Credit Card Required)

Every component is architected to operate on perpetual free tiers:

| Component | Free Platform / Provider | Free Tier Specification |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited free bandwidth & global CDN |
| **Backend API** | [Render](https://render.com) | Free Web Service (512MB RAM, 0.1 CPU) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Sandbox Free Cluster (512MB storage, multi-region) |
| **Payment Gateway** | [Razorpay](https://razorpay.com) | Sandbox Test Mode (Simulated checkout, zero real charges) |
| **Notifications** | [Meta WhatsApp Cloud API](https://developers.facebook.com) | Free Tier (1,000 free service conversations per month) |

---

## 🛡️ Role-Based Access Control (RBAC)

The application provides strict route protection and tailored user experiences for 3 distinct roles:

| Role | Access Permissions | Primary Views |
| :--- | :--- | :--- |
| **👑 Admin** | Full access to everything: customers, fleet, drivers, bookings, billing, user accounts, system logs. | Dashboard, Bookings, Customers, Fleet, Drivers, Invoices, WhatsApp Logs |
| **📋 Dispatcher** | Manage customers, create & assign bookings to vehicles/drivers, update trip statuses, view & generate invoices. | Dashboard, Bookings, Customers, Fleet, Drivers, Invoices, WhatsApp Logs |
| **🚛 Commercial Driver** | Mobile-friendly driver portal: view exclusively their assigned consignments, transition trips to `In-Transit` or `Delivered`. | Driver Active Trips Portal (`/driver-portal`) |

---

## 🚀 Key Modules & System Workflow

```mermaid
graph TD
    A[Shipper / Customer Booking Created] -->|Trigger WhatsApp Alert| B[Booking Pending]
    B -->|Dispatcher Assigns Fleet + Pilot| C[Assigned: Vehicle & Pilot marked On-Trip]
    C -->|Driver Starts Journey| D[In-Transit: WhatsApp Dispatched]
    D -->|Driver Completes Delivery| E[Delivered: Vehicle & Pilot freed to Available]
    E -->|Auto-Generated| F[Invoice Created: Base + 18% GST]
    F -->|Razorpay Test / Cash| G[Invoice Paid: WhatsApp Receipt Dispatched]
```

1. **Authentication & Session Security**: Secure JWT tokens with bcrypt salt rounds, auto-expiring sessions, and axios request/response interceptors.
2. **Customer Management**: Detailed profiles with phone formatting for WhatsApp, company tags, and lifetime trip/billing history drawers.
3. **Fleet & Asset Tracking**: Vehicle registration, capacity, fuel type, and operational status (`Available`, `On-Trip`, `Maintenance`) with live utilization metrics.
4. **Driver Personnel**: Commercial license verification, contact directory, and automatic status linking when assigned to trips.
5. **Consignment Lifecycle**: Status workflow (`Pending` ➔ `Assigned` ➔ `In-Transit` ➔ `Delivered` ➔ `Cancelled`) with immutable timestamp audit timeline.
6. **Invoicing & Razorpay Payments**: Automatic billing upon delivery, Razorpay Standard Checkout popup, HMAC-SHA256 signature verification, manual cash marking fallback, and printable tax invoice slips.
7. **Meta WhatsApp Cloud API**: Non-blocking asynchronous message dispatch with audit logging in MongoDB.
8. **Interactive Analytics Dashboard**: Live KPI cards, monthly consignment volume bar charts, revenue growth curves, and fleet availability donuts powered by Recharts.

---

## 🔑 Demo Accounts (Ready Out-Of-The-Box)

The seed script initializes the following pre-configured demo credentials:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@transportcrm.com` | `Admin@123` |
| **Dispatcher** | `dispatcher@transportcrm.com` | `Dispatcher@123` |
| **Driver** | `driver@transportcrm.com` | `Driver@123` |

*(On the login screen, click any of the 1-Click Demo Fill buttons for instant access!)*

---

## 💻 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18 or v20 LTS recommended)
- [Git](https://git-scm.com)
- MongoDB database (local or free Atlas URI)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env

# Install dependencies
npm install

# Populate demo data (Users, Customers, Fleet, Trips, Invoices)
npm run seed

# Start development server
npm run dev
# Backend starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
cp .env.example .env

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🌐 Complete Zero-Cost Deployment Guide

### Step 1: Set Up MongoDB Atlas Free M0 Cluster
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up for a free account.
2. Click **Create a Database** ➔ Choose **M0 (Free)** sandbox tier.
3. Select your nearest cloud region (e.g. AWS Mumbai `ap-south-1`).
4. In **Security Quickstart**:
   - Create a database user (e.g., username `admin`, password `SecurePassword123`).
   - Under **IP Access List**, click **Add IP Address** ➔ Select **Allow Access from Anywhere (`0.0.0.0/0`)** *(Required so Render cloud servers can connect)*.
5. Go to **Clusters** ➔ **Connect** ➔ **Drivers** ➔ Copy the Connection String:
   ```
   mongodb+srv://admin:SecurePassword123@cluster0.xxxxx.mongodb.net/transport_crm?retryWrites=true&w=majority
   ```

---

### Step 2: Deploy Backend to Render (Free Web Service)
1. Push your repository to GitHub.
2. Sign in to [render.com](https://render.com) using your GitHub account.
3. Click **New +** ➔ **Web Service** ➔ Select your repository.
4. Fill in the deployment settings:
   - **Name**: `transport-crm-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
   - **Plan**: `Free`
5. In **Environment Variables**, add the following:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://admin:SecurePassword123@cluster0.xxxxx.mongodb.net/transport_crm?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_32_character_production_secret`
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: `https://your-transport-crm.vercel.app` *(or `*`)*
   - `RAZORPAY_KEY_ID`: `rzp_test_YourKeyIdHere`
   - `RAZORPAY_KEY_SECRET`: `YourKeySecretHere`
   - `WHATSAPP_PHONE_NUMBER_ID`: `your_whatsapp_phone_number_id`
   - `WHATSAPP_ACCESS_TOKEN`: `your_meta_system_user_token`
6. Click **Create Web Service**. After build completes, Render will provide your public API URL (e.g. `https://transport-crm-api.onrender.com`).
7. **Seed the Cloud DB**: Open the **Shell** tab on Render and run:
   ```bash
   npm run seed
   ```

---

### Step 3: Deploy Frontend to Vercel (Free)
1. Sign in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** ➔ **Project** ➔ Import your repository.
3. In **Project Configuration**:
   - **Root Directory**: Click Edit ➔ Select `frontend`.
   - **Framework Preset**: `Vite` (auto-detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://transport-crm-api.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_YourKeyIdHere`
5. Click **Deploy**. Vercel will build and assign your live production URL (e.g. `https://transport-crm.vercel.app`).

---

### Step 4: Razorpay Test Mode Setup
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Toggle the switch in top header to **Test Mode**.
3. Go to **Settings** ➔ **API Keys** ➔ Click **Generate Test Key**.
4. Copy `Key Id` (`rzp_test_...`) and `Key Secret`.
5. Place them in your backend `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and frontend `.env` (`VITE_RAZORPAY_KEY_ID`).
6. In Test Mode, use Razorpay test cards (e.g., `Card: 4111 1111 1111 1111`, any future expiry, any CVV, OTP `123456`) or UPI simulation to verify payments with zero charges.

---

### Step 5: Meta WhatsApp Cloud API Setup (1,000 Free Conversations/Month)
1. Go to [developers.facebook.com](https://developers.facebook.com) and create a developer account.
2. Create an App ➔ Select **Business** type ➔ Name your app.
3. Under Add Products, click **Set up** on **WhatsApp**.
4. In the WhatsApp API Setup page:
   - Copy the **Temporary Access Token** (or create a permanent System User token under Business Settings).
   - Copy the **Phone Number ID**.
   - Add your test recipient phone number to the To whitelist.
5. Set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` in your backend `.env`.
   *(Note: If left unconfigured, the application runs in dev simulated mode and logs all formatted WhatsApp dispatches to MongoDB without erroring!)*

---

## 📁 Repository Structure

```
transport-crm/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Mongoose Atlas connection
│   │   ├── models/
│   │   │   ├── User.js               # Admin, Dispatcher, Driver users
│   │   │   ├── Customer.js           # Shippers & Consignees
│   │   │   ├── Vehicle.js            # Fleet inventory & statuses
│   │   │   ├── Driver.js             # Commercial drivers
│   │   │   ├── Booking.js            # Consignments & trip timelines
│   │   │   ├── Invoice.js            # Billing & Razorpay links
│   │   │   └── NotificationLog.js    # WhatsApp message audit trail
│   │   ├── controllers/              # REST resource controllers
│   │   ├── routes/                   # RBAC protected route endpoints
│   │   ├── middleware/               # Auth, Role, and Error handlers
│   │   ├── services/
│   │   │   ├── whatsappService.js    # Meta Cloud API wrapper
│   │   │   └── razorpayService.js    # Razorpay order & signature check
│   │   ├── seed/
│   │   │   └── seed.js               # Demo dataset seeder
│   │   └── app.js                    # Express app initialization
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios API clients
│   │   ├── components/
│   │   │   ├── layout/               # Sidebar, Navbar, Layout
│   │   │   └── common/               # ProtectedRoute, Modal, Badge, StatCard
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth state & RBAC provider
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Glassmorphism login & 1-click fill
│   │   │   ├── Dashboard.jsx         # Analytics with Recharts
│   │   │   ├── Bookings.jsx          # Consignments & trip assignment
│   │   │   ├── Customers.jsx         # Shipper directory
│   │   │   ├── Vehicles.jsx          # Fleet asset management
│   │   │   ├── Drivers.jsx           # Pilot roster
│   │   │   ├── Invoices.jsx          # Razorpay checkout & slips
│   │   │   ├── DriverPortal.jsx      # Mobile pilot trip updater
│   │   │   └── Notifications.jsx     # WhatsApp audit log & compose
│   │   ├── index.css                 # CSS Design System
│   │   └── App.jsx                   # React router configuration
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 📜 API Route Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Protected | Fetch current user profile |
| `GET` | `/api/dashboard/metrics` | Admin, Dispatcher | KPI metrics, Recharts series, activity feed |
| `GET` / `POST` | `/api/bookings` | Admin, Dispatcher | List trips with filters / Create consignment |
| `PUT` | `/api/bookings/:id/assign` | Admin, Dispatcher | Assign vehicle + pilot to booking |
| `PUT` | `/api/bookings/:id/status` | All Roles | Update trip lifecycle (`In-Transit`, `Delivered`) |
| `GET` | `/api/bookings/driver/my-trips`| Driver | Fetch trips assigned to logged-in pilot |
| `GET` / `POST` | `/api/customers` | Admin, Dispatcher | Search & create customer profiles |
| `GET` / `POST` | `/api/vehicles` | Admin, Dispatcher | Fleet registry & live status tracker |
| `GET` / `POST` | `/api/drivers` | Admin, Dispatcher | Driver personnel & license records |
| `GET` | `/api/invoices` | Admin, Dispatcher | Invoice ledger & payment statuses |
| `POST` | `/api/invoices/:id/create-order` | Admin, Dispatcher | Initialize Razorpay Test Mode order |
| `POST` | `/api/invoices/:id/verify-payment` | Admin, Dispatcher | Verify Razorpay HMAC signature |
| `PUT` | `/api/invoices/:id/mark-paid` | Admin, Dispatcher | Offline cash payment settlement fallback |
| `GET` / `POST` | `/api/notifications` | Admin, Dispatcher | WhatsApp audit logs / Compose message |

---

## 🎓 Final Year Project Submission Notes

- **Zero Third-Party Paid Services**: Compliant with zero-cost deployment requirements.
- **Production-Ready Code Quality**: Clean modular architecture, ES Modules throughout, proper error handling, sanitized inputs, and responsive UI design.
- **Complete Test Data**: `npm run seed` instantly populates 3 users, 10 customers, 15 fleet assets, 8 drivers, 28 bookings across all states, and delivered invoices.
