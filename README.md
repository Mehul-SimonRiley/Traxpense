# Traxpense 2.0 💰

[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1%2B-black.svg)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue.svg)](https://www.mysql.com/)

Traxpense 2.0 is a premium, open-source personal financial tracker and dashboard designed with modern bento-grid layouts, glowing visual analytics, and absolute privacy. Rebuilt entirely on **FastAPI**, **Next.js**, and **MySQL** to provide high-performance ledger management and budget controls.

---

## 🌟 Key Features

- **📊 Symmetric Bento Dashboard**:
  - Balanced overview card layout detailing Balance, Income, Expense, and Savings.
  - Side-by-side premium visual charts displaying **Income vs Expenses** and **Expense Distribution** without visual clutter.
  - Defaults to **All Time** data visualization unless manually filtered.
- **🔐 Secure Authentication**: JWT session authorization with automatic silent refresh-token rotations.
- **🏷️ Ledger Management (CRUD)**:
  - Add, edit, and delete transactions and custom category labels.
  - Default all-time listing with date range filters.
- **📈 Budget Alerting & Limits**: Create category-based monthly budgets and monitor actual spent metrics in real-time.
- **⚙️ Redesigned Settings Page**:
  - Restructured profile information card with responsive upload controls.
  - Theme switching and customized notification switches for Email/Push channels synced to backend preferences.
- **🎨 Glassmorphic Theme Layout**: Stunning dark mode with vibrant neon teal highlights, flat cards, and responsive side navigation.

---

## 🛠️ Architecture Overview

```
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── api/routes/        # REST Endpoints (Auth, Users, Transactions, Dashboard, etc.)
│   │   ├── core/              # Global Configurations, Security JWT utilities
│   │   ├── db/                # Database Engine & SQLAlchemy Base
│   │   ├── models/            # SQLAlchemy Declarative Models (User, Transaction, Budget)
│   │   ├── schemas/           # Pydantic v2 Request/Response Data Validation
│   │   └── main.py            # API App entrypoint & Auto-schema Initialization
│   └── requirements.txt       # Python dependencies (pymysql, passlib, jose, etc.)
│
├── frontend-next/             # Next.js 16 Frontend (App Router, React 19)
│   ├── src/
│   │   ├── app/               # Pages & Routings (Dashboard, Settings, Reports, etc.)
│   │   ├── components/        # Reusable UI & Chart Modules (ModernBarChart, Sparkline)
│   │   ├── services/          # Client API calls (Axios client)
│   │   └── styles/            # Vanilla CSS stylesheets
│   └── next.config.mjs        # Next.js configuration & Port proxy rewrite rules
```

---

## 🚀 Setup & Installation

### Prerequisite Services
Ensure you have the following installed locally:
- **Python 3.10+**
- **Node.js 18+ & npm**
- **MySQL Server 8.0+**

### 1. Database Creation
Create a blank database named `traxpense` inside your local MySQL server:
```sql
CREATE DATABASE traxpense;
```

---

### 2. Backend Installation (FastAPI)

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Setup a virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the environment:
   - **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   - **Windows (CMD)**: `.venv\Scripts\activate.bat`
   - **macOS/Linux**: `source .venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables. Update [`.env`](file:///c:/Study%20Material%20And%20Projects/traxpense_2.0/.env) in the root directory:
   ```env
   DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/traxpense
   SECRET_KEY=dev-secret-key-local
   JWT_SECRET_KEY=jwt-secret-key-local
   ```

6. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *FastAPI will automatically generate all table schemas in your MySQL database on start. The API docs will be active at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### 3. Frontend Installation (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend-next
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
   *The client interface will boot at [http://localhost:3000](http://localhost:3000).*

---
