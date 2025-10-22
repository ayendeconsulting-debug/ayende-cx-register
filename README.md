# Ayende-CX Payment Register System

A modern cloud-hosted POS (Point of Sale) system with integrated CRM capabilities for local businesses.

## Features

- **Payment Register (POS)**: Till-like interface for processing transactions
- **Product Management**: Catalog with categories, inventory tracking
- **Customer Relationship Management**: Customer profiles, purchase history
- **Loyalty Program**: Points accumulation, tiered rewards, redemptions
- **User Management**: Staff authentication with role-based access
- **Shift Management**: Cash drawer tracking and reconciliation
- **Audit Trail**: Complete system activity logging
- **Real-time Inventory**: Automatic stock updates with low-stock alerts

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcrypt

### Frontend (Coming Next)
- **Framework**: React + Vite
- **UI Library**: Tailwind CSS
- **State Management**: TBD (Redux Toolkit or Zustand)

## Project Structure

```
ayende-cx-register/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Sample data
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # Prisma client
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT authentication
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   ├── routes/
│   │   │   └── authRoutes.js
│   │   ├── utils/
│   │   │   ├── auth.js        # Auth utilities
│   │   │   └── response.js    # Response formatters
│   │   └── server.js          # Main server file
│   ├── .env.example
│   └── package.json
├── frontend/                  # (To be created)
└── shared/                    # (Shared types/utilities)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (or navigate to project directory)

2. **Setup Backend**

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

3. **Configure Database**

Update the `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ayende_cx_db"
```

4. **Initialize Database**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (create database tables)
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

5. **Start Development Server**

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Default Login Credentials

After seeding the database:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Cashier Account:**
- Username: `cashier`
- Password: `cashier123`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/logout` | User logout | Yes |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health status | No |

## Database Schema Overview

### Core Entities

- **User**: Staff members with role-based access (SUPER_ADMIN, ADMIN, CASHIER, INVENTORY_MANAGER)
- **Customer**: Customer profiles with loyalty tracking
- **Product**: Product catalog with inventory management
- **Category**: Product categorization
- **Transaction**: POS sales transactions
- **TransactionItem**: Line items in transactions
- **Shift**: Cash drawer management
- **LoyaltyTransaction**: Points earned/redeemed history
- **AuditLog**: System activity tracking

## User Roles & Permissions

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Business owner/manager level access
- **CASHIER**: POS operations only
- **INVENTORY_MANAGER**: Stock management only

## Development Workflow

### Adding New Features

1. Update database schema in `prisma/schema.prisma`
2. Run migration: `npm run prisma:migrate`
3. Create controller in `src/controllers/`
4. Create routes in `src/routes/`
5. Register routes in `src/server.js`

### Database Management

```bash
# View database in browser
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Next Steps

Phase 2 will include:
1. Product Management API
2. Transaction Processing API
3. Customer Management API
4. React Frontend Setup
5. POS Interface Development

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: development/production

## Contributing

This is an incremental build project. Each phase will be documented and tested before proceeding.

## License

MIT

---

**Current Status**: Phase 1 Complete - Foundation & Authentication
**Next Phase**: Product Management & Transaction APIs
