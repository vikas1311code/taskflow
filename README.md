# ⚡ TaskFlow – Scalable REST API with Auth & RBAC

A production-ready full-stack application built for the Primetrade.ai Backend Intern assignment.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT (Access + Refresh tokens) |
| Password Hashing | bcryptjs (12 rounds) |
| Validation | express-validator |
| API Docs | Swagger (OpenAPI 3.0) |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting, XSS sanitization |
| Frontend | React.js + React Router |
| HTTP Client | Axios with interceptors |

---

## 📦 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/         # DB pool, Swagger, migrations
│   │   ├── controllers/    # Auth, Task, Admin controllers
│   │   ├── middleware/     # Auth JWT, validation, error handling
│   │   ├── models/         # User, Task models (raw SQL)
│   │   ├── routes/         # auth.js, tasks.js, admin.js
│   │   ├── utils/          # jwt.js, logger.js, response.js
│   │   ├── validators/     # express-validator schemas
│   │   └── server.js       # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance + API functions
    │   ├── context/        # AuthContext (React Context)
    │   ├── components/     # ProtectedRoute
    │   ├── pages/          # AuthPage, Dashboard
    │   └── App.js
    └── package.json
```

---

## 🚀 Setup Instructions (WSL / Ubuntu)

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start

# Verify
node -v && npm -v && psql --version
```

### 1. Database Setup

```bash
sudo -u postgres psql

# Inside psql shell:
CREATE DATABASE taskflow_db;
CREATE USER taskflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taskflow_db TO taskflow_user;
\q
```

### 2. Backend Setup

```bash
cd taskflow/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and secrets:
nano .env

# Run database migrations (creates all tables)
npm run migrate

# Start development server
npm run dev
```

Backend runs at: **http://localhost:5000**  
Swagger docs at: **http://localhost:5000/api-docs**

### 3. Frontend Setup

```bash
cd taskflow/frontend

# Install dependencies
npm install

# Start React app
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 📌 API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, get JWT tokens |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ❌ | Revoke refresh token |
| GET | `/me` | ✅ | Get current user |
| PUT | `/change-password` | ✅ | Change password |

### Tasks — `/api/v1/tasks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | List tasks (paginated, filtered) |
| POST | `/` | ✅ | Create new task |
| GET | `/stats` | ✅ | Get task stats |
| GET | `/:id` | ✅ | Get single task |
| PUT | `/:id` | ✅ | Update task |
| DELETE | `/:id` | ✅ | Delete task |

### Admin — `/api/v1/admin` (admin role required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | 🔐 Admin | List all users |
| GET | `/users/:id` | 🔐 Admin | Get user by ID |
| PUT | `/users/:id` | 🔐 Admin | Update any user |
| DELETE | `/users/:id` | 🔐 Admin | Delete user |

---

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Access Tokens**: Short-lived (7d), signed with secret
- **Refresh Token Rotation**: Stored in DB, rotated on each use
- **Token Revocation**: Logout invalidates tokens immediately
- **Rate Limiting**: Auth endpoints: 10 req/15min; Global: 100 req/15min
- **Helmet.js**: Sets security HTTP headers
- **CORS**: Whitelist-only origins
- **Input Validation**: express-validator on all inputs
- **XSS Sanitization**: xss package on user content
- **Role-Based Access**: Users see only their own data; Admins see all
- **Account Deactivation**: Revokes all existing tokens

---

## 🗄️ Database Schema

```sql
users
  id UUID PK, name, email UNIQUE, password_hash,
  role (user|admin), is_active, created_at, updated_at

refresh_tokens
  id UUID PK, user_id FK→users, token UNIQUE,
  expires_at, created_at

tasks
  id UUID PK, title, description, 
  status (pending|in_progress|completed|cancelled),
  priority (low|medium|high), due_date,
  user_id FK→users, created_at, updated_at
```

---

## 📈 Scalability Note

### Current Architecture
Single Node.js server with PostgreSQL using connection pooling (max 20 connections).

### Scaling Strategy

**Horizontal Scaling**
- Deploy multiple Node.js instances behind an **Nginx load balancer** (round-robin)
- Use **sticky sessions** or stateless JWT (already implemented) to support this

**Database Scaling**
- Add **read replicas** for GET-heavy workloads
- Use **PgBouncer** for connection pooling at scale
- Partition `tasks` table by `user_id` or `created_at` at large volumes

**Caching (Redis)**
- Cache task stats and user profiles with 60s TTL
- Store refresh tokens in Redis instead of Postgres for O(1) lookup
- Rate limiting via Redis for distributed environments

**Microservices Path**
- Split into: `auth-service`, `task-service`, `notification-service`
- Use message queues (RabbitMQ/Kafka) for async operations
- API Gateway (Kong/Nginx) handles routing and auth

**Deployment**
```
Docker → docker-compose (dev) → Kubernetes (prod)
CI/CD: GitHub Actions → build → test → push image → deploy
```

```
                    ┌─── Load Balancer (Nginx) ───┐
                    │                              │
              API Node 1                     API Node 2
                    │                              │
              ┌─────┴──────────────────────────────┘
              │
       PostgreSQL Primary ──── Read Replica
              │
           Redis Cache
```

---

## 🧪 Quick Test with curl

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password1","role":"admin"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}'

# Create Task (replace TOKEN)
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","priority":"high","status":"pending"}'
```

---

## 📄 API Documentation
Full interactive docs available at: `http://localhost:5000/api-docs`  
Raw JSON spec at: `http://localhost:5000/api-docs.json`
