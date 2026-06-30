# SecureAuth Express Server Module

This is the Node.js Express server backend supplying authentication, granular PBAC middleware validation, MongoDB datastore management, auditing, and SMTP signup invitations.

---

## 🛠️ Tech Stack & Packages
* **Runtime:** Node.js & Express
* **Database Object Modeling:** Mongoose ODM
* **Security Shields:** Bcrypt (cost 12), Helmet headers protection, rate limits, mongo-sanitize
* **Logger:** Winston Logger
* **Verification:** Joi schema-based payload & environment validation
* **Email Sender:** Nodemailer (SMTP dispatcher with custom fallback logs emulator)

---

## ⚙️ Configuration & Environment Setup

Before running the server, create a `.env` file inside this directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/role-auth-db // change this to your mongodb url

JWT_ACCESS_SECRET=your_jwt_access_security_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_security_key_here

# SMTP Email Configuration (Optional / Gmail-ready)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_real_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=your_real_gmail@gmail.com
```

---

## 🚀 Getting Started

### 1. Requirements
* **Node.js** (v18+)
* **MongoDB** (running locally on custom or default connection strings)

### 2. Seeding & Running Server
```bash
# Install dependencies
npm install

# Seed clean collections (Drops database collections and repopulates roles/products/users)
npm run seed

# Run Server
npm run start
```
*The Server APIs will be live at: `http://localhost:5000`*

---

## 🔑 Default Seed Logins
If the database runs after seeding `npm run seed`:
* **Admin:** `admin@example.com` / `Admin@12345`
* **Manager:** `manager@example.com` / `Admin@12345`
* **Employee:** `employee@example.com` / `Admin@12345`

---

## 📧 Invitation Email Emulator
When you invite a guest user:
* **SMTP Active:** Sends an invitation directly to their inbox.
* **SMTP Config Empty:** Outputs the invitation URL directly inside the command console logs:
  ```text
  === INVITATION EMAIL EMULATOR ===
  TO: guest@domain.com
  LINK: http://localhost:5173/accept-invitation?token=75b6e...
  =================================
  ```
  Simply copy the printed link and use it in your browser to sign up.
