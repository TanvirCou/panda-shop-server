# 🚀 PandaShop Server — Backend for Multi-Vendor E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-API-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-API-blue)](https://stripe.com/)

## Overview

**PandaShop Server** is the architectural backbone of a high-performance, AI-powered multi-vendor e-commerce platform. Engineered for scalability and hardened for security, it provides the core infrastructure unifying user management, complex product catalogs, real-time order processing, and comprehensive vendor dashboards.

At its core, the system leverages **Node.js**, **Express**, and **MongoDB** to deliver a robust suite of REST API services. Key capabilities now include deep **Google Gemini AI** integration—powering semantic vector-based product searches and real-time conversational intent extraction. The backend further fortifies the e-commerce lifecycle with JWT-based active session management, automated SMTP email dispatch, secure Stripe payment webhooks, **time-limited cryptographic sale events**, and a **verified customer review system**.

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

### 🧠 AI Search Engine (New)
- **Semantic Text Embeddings:** Deep integration with Google's Gemini AI to instantly vectorize product titles, descriptions, and user queries.
- **In-Memory Cosine Similarity:** Custom mathematical matching algorithm running efficiently in Node.js to compute precise similarity ranking scores on the fly.
- **Conversational Parsing:** Parallel extraction of intent (budget limits, explicit categories, and dynamic keywords) from natural language user prompts.

### 🏪 Multi-Vendor Core
- **Vendor Management:** Comprehensive lifecycle for shops (registration, approval, balance tracking).
- **Product & Inventory:** Advanced CRUD for products with category-based filtering and stock management. Automatic generation of vector embeddings upon creation.
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
| **Database** | MongoDB (via Mongoose 8.0.3) |
| **AI Integration** | Google Gemini API (@google/genai) 1.46.0 |
| **Authentication** | JSON Web Token (JWT) 9.0.2 + BcryptJS 2.4.3 |
| **Payment Gateway** | Stripe API 14.16.0 |
| **Email Service** | Nodemailer (SMTP) 6.9.8 |
| **Development** | Nodemon 3.0.2 + Dotenv 16.3.1 |

---

## 📡 API Endpoints Summary

| Base Route | Description |
|---|---|
| `/api/ai` | AI-powered semantic and conversational product search |
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
├── scripts/            # Database migration and generative AI utility scripts
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
   GEMINI_API_KEY=<your-google-gemini-key>
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
