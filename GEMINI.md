# GEMINI.md

## Project Overview
The **Sistema de Finanças Pessoais** is a comprehensive full-stack application for personal financial management. It features an analytical dashboard, auxiliary registries (banks, categories, descriptions), and transaction management.

- **Backend:** Node.js, Express, TypeScript, MySQL (via `mysql2`).
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Material UI (MUI), Recharts.
- **Infrastructure:** Docker and Docker Compose for orchestration.

## Technical Architecture

### Backend (`/backend`)
The backend follows a layered architecture to ensure separation of concerns:
- **Routes:** Define API endpoints and apply middlewares.
- **Middlewares:** Handle authentication (`JWT`), error handling, and request validation.
- **Controllers:** Orchestrate the flow between the request and the service layer.
- **Services:** Contain the core business logic.
- **Repositories:** Encapsulate database access logic (SQL queries).
- **Schemas:** Request validation using **Zod**.
- **Models:** Database connection pool and table initialization.

**Key Features:**
- Automatic database table creation/migration on startup.
- Swagger documentation available at `/api-docs`.
- Custom test runner and coverage reporting.

### Frontend (`/frontend`)
The frontend is built with Next.js 14 and modern React patterns:
- **App Router:** Utilizes the latest Next.js routing and layout system.
- **Services:** Centralized API communication using **Axios** with JWT interceptors.
- **Components:** Mix of custom Tailwind-styled components and Material UI (MUI) for complex UI elements.
- **Theming:** Support for dark/light modes and custom MUI themes.

## Building and Running

### Prerequisites
- Node.js 18+
- MySQL 8+ (if running locally)
- Docker & Docker Compose (optional for containerized setup)

### Docker Setup (Recommended)
Run the entire stack from the root directory:
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api-docs`

### Manual Setup

#### 1. Database
Create the database:
```sql
CREATE DATABASE financas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### Testing & Quality
- **Backend Tests:** `npm run test` (inside `/backend`)
- **Backend Coverage:** `npm run test:coverage`
- **Frontend Linting:** `npm run lint` (inside `/frontend`)

## Development Conventions

### Coding Standards
- **Strict TypeScript:** No `any` types; all interfaces and types must be explicitly defined.
- **Layered Backend:** Always respect the `Routes -> Controllers -> Services -> Repositories` flow.
- **Frontend Services:** API calls must be placed in the `src/services` directory.
- **Validation:** Use Zod schemas for all external data inputs in the backend.

### Contribution Workflow
- **Branching:** Use `feat/` for new features and `fix/` for bug fixes.
- **Commits:** Follow conventional commits (e.g., `feat:`, `fix:`, `chore:`, `docs:`).
- **PRs:** Ensure both backend and frontend build successfully (`npm run build`) before submitting.
- **Security:** Never commit `.env` files or sensitive credentials.

### Database Migrations
Migrations are handled programmatically in `backend/src/config/database.ts`. When adding new tables or columns, update the `initDatabase` function with `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE` wrapped in try-catch blocks for idempotency.
