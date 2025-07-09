# HelpDeskXP - Local Development Setup

## Overview
HelpDeskXP is a full-stack learning platform for tech support education built with React, TypeScript, Express, and PostgreSQL.

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git

## Local Development Setup

### 1. Clone/Download the Project
Download all the project files to your local machine.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a PostgreSQL database and update your environment variables:

```bash
# Create a new database
createdb helpdeskxp

# Or using PostgreSQL command line
psql -U postgres -c "CREATE DATABASE helpdeskxp;"
```

### 4. Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/helpdeskxp"
PGHOST=localhost
PGPORT=5432
PGDATABASE=helpdeskxp
PGUSER=your_username
PGPASSWORD=your_password

# Session (generate a random secret)
SESSION_SECRET="your-super-secret-session-key-here"

# Replit Auth (for production - optional for local dev)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc
```

### 5. Database Schema
Push the database schema:

```bash
npm run db:push
```

### 6. Create an Admin User
After running the app and creating your first user account, make yourself an admin:

```sql
-- Connect to your database and run:
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### 7. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
├── server/          # Express backend
│   ├── index.ts
│   ├── routes.ts
│   └── storage.ts
├── shared/          # Shared types and schemas
│   └── schema.ts
└── package.json
```

## Key Features
- User authentication with sessions
- Course management (CRUD operations)
- User enrollment and progress tracking
- Premium course purchases
- Admin dashboard for course management
- Responsive design for all devices

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open database studio (if available)

## Authentication Notes
For local development, you can either:
1. Set up Replit Auth (recommended for production)
2. Modify the auth system for local development
3. Use the existing session-based auth with manual user creation

## Database Schema
The application uses these main tables:
- `users` - User accounts and profiles
- `courses` - Course catalog
- `enrollments` - User course enrollments
- `purchases` - Premium course purchases
- `sessions` - User session management

## Troubleshooting
- Ensure PostgreSQL is running
- Check database connection string
- Verify all environment variables are set
- Check Node.js version compatibility

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Replit Auth
- **UI Components**: shadcn/ui with Radix UI