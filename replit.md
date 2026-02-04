# Sales Field Reporting Application

## Overview

A web/mobile application for field sales executives in a curriculum publication and distribution business. The system enables sales staff to log daily school visits with location proof, photos, and meeting details while providing management with centralized tracking and reporting capabilities.

**Core Purpose:**
- Digitize field sales reporting (replacing manual/informal reporting)
- Track school visits with GPS location and photo verification
- Enable management to monitor sales activity, performance, and coverage
- Support 4-6 daily visits per sales executive

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight router)
- **State Management:** TanStack React Query for server state
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming
- **Forms:** React Hook Form with Zod validation
- **Build Tool:** Vite

### Backend Architecture
- **Runtime:** Node.js with Express 5
- **Language:** TypeScript (ESM modules)
- **API Pattern:** RESTful endpoints under `/api/*`
- **Session Management:** Express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication:** Passport.js with Local Strategy
- **File Uploads:** Multer with disk storage to `/uploads` directory

### Data Storage
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM with drizzle-zod for schema validation
- **Schema Location:** `shared/schema.ts`
- **Migrations:** Drizzle Kit (`drizzle-kit push`)

### Key Data Models
1. **Users** - Sales executives and admins with role-based access
2. **Visits** - School visit records with location, photos, contact details, meeting notes, and sample tracking

### Authentication & Authorization
- Cookie-based sessions with credentials included in requests
- Role-based access control: `executive` and `admin` roles
- Protected routes component for frontend authorization
- Simple password comparison (plaintext for demo purposes per requirements)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API endpoints
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle schema definitions
│   └── routes.ts     # API route definitions
└── uploads/          # File upload storage
```

## External Dependencies

### Database
- **PostgreSQL** - Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM** - Database queries and schema management
- **connect-pg-simple** - Session storage in PostgreSQL

### Authentication
- **Passport.js** - Authentication middleware
- **passport-local** - Username/password authentication strategy
- **express-session** - Session management

### File Storage
- **Multer** - Multipart form handling for file uploads
- Files stored locally in `/uploads` directory and served statically

### Frontend Libraries
- **@tanstack/react-query** - Server state management
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **date-fns** - Date formatting
- **react-day-picker** - Calendar component
- **recharts** - Charts for admin dashboard

### Build & Development
- **Vite** - Frontend build tool with HMR
- **esbuild** - Server bundling for production
- **tsx** - TypeScript execution for development