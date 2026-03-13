# 🚀 PandaShop Server — Backend for Multi-Vendor E-Commerce

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-API-blue)](https://stripe.com/)

## Overview

This is the backend API for **PandaShop**, a powerful multi-vendor e-commerce platform. It provides a robust, secure, and scalable foundation for managing users, products, orders, payments, and multi-vendor dashboards.

Built with **Node.js**, **Express**, and **MongoDB**, it provides a comprehensive suite of features including JWT-based authentication with refresh tokens, automated email systems for account activation, and integrated Stripe payments. It also handles the complete e-commerce lifecycle: **multi-vendor product management**, **time-limited sale events**, **order processing with real-time status updates**, and a **verified review system**.

---

## 📺 Live API Base URL

🔗 [https://panda-shop-server-production.up.railway.app](https://panda-shop-server-production.up.railway.app)

---

## 🔗 Repositories

- **Server (This Repo):** [Backend Repository](https://github.com/TanvirCou/panda-shop-server)
- **Client:** [Frontend Repository](https://github.com/TanvirCou/panda-shop)

---

## 🚀 Key Features

### 🔐 Advanced Security & Auth
- **JWT Protection:** Secure sessions using separate Access and Refresh tokens.
- **Role-Based Access Control (RBAC):** Middleware-driven protection for `User`, `Seller`, and `Admin` routes.
- **Account Verification:** Link-based email activation for new accounts.
- **Password Security:** Multi-layered hashing using `bcryptjs`.

### 🏪 Multi-Vendor Core
- **Vendor Management:** Comprehensive lifecycle for shops (registration, approval, balance tracking).
- **Product & Inventory:** Advanced CRUD for products with category-based filtering and stock management.
- **Event Engine:** Sale event system with time-based triggers and automated discounting.

### 💳 Payments & Logistics
- **Stripe Integration:** Secure server-side payment processing and webhooks.
- **Order Tracking:** Complex state machine for order status (`Processing` to `Delivered`).
- **Refund & Withdrawal Workflow:** Automated balance adjustments and withdrawal request management.

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js 4.18.2 |
| **Database** | MongoDB (via Mongoose) 8.0.3 |
| **Authentication** | JSON Web Token (JWT) 9.0.2 + BcryptJS 2.4.3 |
| **Payment Gateway** | Stripe API 14.16.0 |
| **Email Service** | Nodemailer (SMTP) 6.9.8 |
| **Development** | Nodemon 3.0.2 + Dotenv 16.3.1 |

---

## 📡 API Endpoints Summary

| Base Route | Description |
|---|---|
| `/api/user` | User authentication, profile, and address management |
| `/api/shop` | Shop registration, authentication, and shop details |
| `/api/product` | Product CRUD, reviews, and inventory |
| `/api/event` | Sale event creation and management |
| `/api/order` | Order processing, history, and status tracking |
| `/api/payment` | Stripe payment intent and API key retrieval |
| `/api/withdraw` | Shop withdrawal request handling |
| `/api/coupon-code` | Discount coupon management per shop |

---

## 📁 Project Structure

```bash
├── config/             # Environment variables and configurations
├── controller/         # Request handlers (Business Logic)
├── db/                 # Database connection logic
├── middleware/         # Auth, Error handling, and validation
├── model/              # Mongoose schemas (Data Logic)
├── utils/              # Helper functions (JWT, Email, Error classes)
├── app.js              # Express app initialization
└── server.js           # Server entry point
```

---

## 📦 Installation & Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/TanvirCou/panda-shop-server
   cd panda-shop-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `config/` directory and populate it with:
   ```env
   PORT=3000
   MONGO_URL=<your-mongodb-uri>
   JWT_SECRET_KEY=<your-secret>
   JWT_EXPIRES=7d
   ACTIVATION_SECRET=<your-activation-secret>
   STRIPE_API_KEY=<your-stripe-key>
   STRIPE_SECRET_KEY=<your-stripe-secret>
   SMTP_HOST=<your-smtp-host>
   SMTP_PORT=<your-smtp-port>
   SMTP_USER=<your-smtp-user>
   SMTP_PASSWORD=<your-smtp-pass>
   ```

4. **Run the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

---

## 📄 License

This project is for educational and portfolio purposes.
