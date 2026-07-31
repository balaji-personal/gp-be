# 🏛️ Machnoor Gram Panchayat - Backend API Service

Express + Drizzle ORM + PostgreSQL backend service for the **Machnoor Gram Panchayat** Complaint Management System.

---

## 📁 Environment Variables Setup

Create a `.env` file in the root directory (`grampanchayat-backend/.env`) with the following environment variables:

```env
# 1. DATABASE CONFIGURATION (PostgreSQL)
DATABASE_URL=postgresql://postgres:Balaji@123@localhost:5432/grampanchayat-machnoor

# 2. CLOUDINARY CONFIGURATION (Optional - Fallback data URI supported if unconfigured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 3. JWT SECURITY CONFIGURATION
JWT_SECRET=your_super_secret_key_change_in_production_12345678
JWT_EXPIRY=365d

# 4. SERVER CONFIGURATION
PORT=5000
NODE_ENV=development

# 5. DEFAULT ADMIN CREDENTIALS
ADMIN_PHONE=9999999999
ADMIN_PIN=0000
```

---

## 🚀 How to Run the Backend

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed the Database
Seed state, district, mandal, gram panchayat, default admin, sachiv, villager, and sample complaints:
```bash
npm run db:seed
```

### Step 3: Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 🔑 Default Credentials Seeded

| Role | Phone | PIN | Description |
| :--- | :--- | :--- | :--- |
| **Admin / Collector** | `9999999999` | `0000` | Full state/district access on Web Portal |
| **Sachiv / Sarpanch** | `9876543210` | `1234` | Panchayat Secretary for Machnoor GP |
| **Villager** | `9812345678` | `1234` | Test Villager (`B. Balaji`) |

---

## 🛠️ API Endpoints Summary

- `POST /api/auth/register`: Register new villager
- `POST /api/auth/login`: Login villager / Sachiv
- `POST /api/admin/login`: State Admin login
- `GET /api/admin/analytics`: Get real-time grievance metrics & SMS cost total
- `GET /api/admin/complaints`: View state-wise complaints with filters
- `POST /api/admin/add-sarpanch`: Register Sachiv account
- `GET /api/admin/villages`: List Gram Panchayats hierarchy
- `POST /api/complaints/register`: Register complaint (voice audio + photos)
- `GET /api/complaints/my-complaints`: View user's complaints
- `PUT /api/sarpanch/complaints/:id/status`: Update status & dispatch SMS alert


DATABASE_URL=postgresql://neondb_owner:npg_Qec1wsIFWa5Y@ep-quiet-salad-axjca9h2.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
