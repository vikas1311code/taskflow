# ⚡ TaskFlow — Scalable REST API with Auth & RBAC

> A production-ready full-stack Task Management application built as part of the **Primetrade.ai Backend Intern Assignment**.

![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Auth](https://img.shields.io/badge/Auth-JWT-orange)
![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB)

---

## 🔗 Live Links

| | Link |
|---|---|
| 🌐 **Frontend (Live App)** | [taskflow-mauve-two.vercel.app](https://taskflow-mauve-two.vercel.app) |
| ⚙️ **Backend API** | [taskflow-backend-4xdz.onrender.com](https://taskflow-backend-4xdz.onrender.com) |
| 📚 **Swagger API Docs** | [taskflow-backend-4xdz.onrender.com/api-docs](https://taskflow-backend-4xdz.onrender.com/api-docs) |
| 💻 **GitHub Repository** | [github.com/vikas1311code/taskflow](https://github.com/vikas1311code/taskflow) |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL (Neon / Render) |
| **Authentication** | JWT — Access Token + Refresh Token |
| **Password Hashing** | bcryptjs (12 salt rounds) |
| **Validation** | express-validator |
| **API Docs** | Swagger UI (OpenAPI 3.0) |
| **Logging** | Winston |
| **Security** | Helmet, CORS, Rate Limiting, XSS Sanitization |
| **Frontend** | React.js + React Router v6 |
| **HTTP Client** | Axios with interceptors |
| **Deployment** | Vercel (Frontend) + Render (Backend) |
| **Containerization** | Docker + docker-compose |

---

## 📦 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/         # DB pool, Swagger config, migrations
│   │   ├── controllers/    # authController, taskController, adminController
│   │   ├── middleware/     # JWT auth, validation, error handling
│   │   ├── models/         # User model, Task model (raw SQL)
│   │   ├── routes/         # auth.js, tasks.js, admin.js (versioned)
│   │   ├── utils/          # jwt.js, logger.js, response.js
│   │   ├── validators/     # express-validator schemas
│   │   └── server.js       # App entry point
│   ├── logs/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance + all API functions
│   │   ├── context/        # AuthContext (React Context API)
│   │   ├── components/     # ProtectedRoute
│   │   ├── pages/          # AuthPage (Login/Register), Dashboard
│   │   └── App.js
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Local Setup (WSL / Ubuntu)

### Prerequisites

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start
```

### 1. Clone the Repository

```bash
git clone https://github.com/vikas1311code/taskflow.git
cd taskflow/taskflow
```

### 2. Database Setup

```bash
sudo -u postgres psql

# Inside psql:
CREATE DATABASE taskflow_db;
CREATE USER taskflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow_user;
\q
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your DB credentials and JWT secrets in .env
npm run migrate   # Creates all tables
npm run dev       # Starts on http://localhost:5000
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm start         # Starts on http://localhost:3000
```

### 5. Docker (Optional)

```bash
# From root folder
docker-compose up --build
```

---

## 📌 API Endpoints

Base URL: `https://taskflow-backend-4xdz.onrender.com/api/v1`

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, receive JWT tokens |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ❌ | Revoke refresh token |
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/change-password` | ✅ | Change user password |

### ✅ Tasks — `/api/v1/tasks`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/` | ✅ | List tasks (paginated + filtered) |
| POST | `/` | ✅ | Create new task |
| GET | `/stats` | ✅ | Get task statistics |
| GET | `/:id` | ✅ | Get single task by ID |
| PUT | `/:id` | ✅ | Update task |
| DELETE | `/:id` | ✅ | Delete task |

### 👑 Admin — `/api/v1/admin` *(Admin role required)*

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/users` | 🔐 Admin | List all users |
| GET | `/users/:id` | 🔐 Admin | Get user by ID |
| PUT | `/users/:id` | 🔐 Admin | Update any user |
| DELETE | `/users/:id` | 🔐 Admin | Delete user |

---

## 🗄️ Database Schema

```sql
-- Users
users (
  id UUID PK,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at, updated_at TIMESTAMPTZ
)

-- Refresh Tokens (token rotation)
refresh_tokens (
  id UUID PK,
  user_id UUID FK → users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE,
  expires_at TIMESTAMPTZ
)

-- Tasks
tasks (
  id UUID PK,
  title VARCHAR(200),
  description TEXT,
  status CHECK (pending | in_progress | completed | cancelled),
  priority CHECK (low | medium | high),
  due_date TIMESTAMPTZ,
  user_id UUID FK → users(id) ON DELETE CASCADE,
  created_at, updated_at TIMESTAMPTZ
)
```

**Indexes:** `idx_tasks_user_id`, `idx_tasks_status`, `idx_users_email`, `idx_refresh_tokens_user_id`

---

## 🔐 Security Features

- **Password Hashing** — bcryptjs with 12 salt rounds
- **JWT Access Tokens** — Short-lived (7d), signed with secret
- **Refresh Token Rotation** — Stored in DB, rotated on every use
- **Token Revocation** — Logout immediately invalidates tokens
- **Rate Limiting** — Auth: 10 req/15min | Global: 100 req/15min
- **Helmet.js** — Secure HTTP headers
- **CORS** — Whitelist-only origins
- **Input Validation** — express-validator on all inputs
- **XSS Sanitization** — `xss` package on all user content
- **Role-Based Access** — Users see only their data; Admins see all
- **Account Deactivation** — Revokes all existing tokens instantly

---

## 🧪 Quick Test with curl

```bash
# 1. Register
curl -X POST https://taskflow-backend-4xdz.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password1","role":"admin"}'

# 2. Login
curl -X POST https://taskflow-backend-4xdz.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}'

# 3. Create Task (replace YOUR_TOKEN)
curl -X POST https://taskflow-backend-4xdz.onrender.com/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","priority":"high","status":"pending"}'

# 4. Get all tasks
curl https://taskflow-backend-4xdz.onrender.com/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📈 Scalability Note

### Current Architecture
Single Node.js server + PostgreSQL with connection pooling (max 20 connections).

### Scaling Strategy

**Horizontal Scaling**
- Multiple Node.js instances behind **Nginx Load Balancer** (round-robin)
- Stateless JWT already supports this — no sticky sessions needed

**Database Scaling**
- **Read Replicas** for GET-heavy workloads
- **PgBouncer** for connection pooling at scale
- Partition `tasks` table by `user_id` at large volumes

**Caching (Redis)**
- Cache task stats + user profiles with 60s TTL
- Move refresh tokens to Redis for O(1) lookup
- Distributed rate limiting via Redis

**Microservices Path**
```
auth-service → task-service → notification-service
       ↓              ↓
   API Gateway (Kong/Nginx)
   Message Queue (RabbitMQ/Kafka)
```

**Deployment Pipeline**
```
GitHub Push → GitHub Actions CI → Docker Build → Deploy
     ↓
Docker → docker-compose (dev) → Kubernetes (prod)
```

**Architecture Diagram**
```
              ┌─── Nginx Load Balancer ───┐
              │                           │
        API Node 1                  API Node 2
              │                           │
        ┌─────┴───────────────────────────┘
        │
  PostgreSQL Primary ──── Read Replica
        │
    Redis Cache
```

---

## 📄 API Documentation

Interactive Swagger UI: **[taskflow-backend-4xdz.onrender.com/api-docs](https://taskflow-backend-4xdz.onrender.com/api-docs)**

Raw JSON spec: `https://taskflow-backend-4xdz.onrender.com/api-docs.json`

---

## 👨‍💻 Author

**Vikas** — [github.com/vikas1311code](https://github.com/vikas1311code)

Built for **Primetrade.ai Backend Intern Assignment** 🚀
