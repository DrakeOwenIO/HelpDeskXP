# HelpDeskXP Learning Platform

## Overview

HelpDeskXP is a full-stack web application built as a learning platform focused on computer troubleshooting and tech support education. The application launches with a single comprehensive masterclass course on everyday computer usage and troubleshooting, featuring a fixed-price model with no free courses or monthly memberships initially.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations
- **Connection**: Neon serverless connection with WebSocket support

## Key Components

### Authentication System
- Replit Auth integration with mandatory user and session tables
- OpenID Connect (OIDC) discovery for secure authentication
- Session-based authentication with PostgreSQL session storage
- User roles (admin, premium, regular users)

### Course Management
- Single masterclass course model focusing on everyday computer usage and troubleshooting
- Course covers task manager usage, printer setup, router configuration, and essential troubleshooting
- Fixed-price model with one-time payment ($97)
- Course enrollment and progress tracking
- Purchase system for single course access
- "More courses coming soon" messaging for future expansion

### Community Forum System
- Public forum access for reading posts and replies
- User authentication required for creating posts, replies, and voting
- Category-based organization (General, Hardware, Software, Security, Networking, Mobile Devices, Troubleshooting)
- Upvoting system for posts and replies
- Real-time reply count and vote tracking
- Sticky posts and content moderation features

### User Interface
- Responsive design with mobile-first approach
- Dark/light theme support via CSS variables
- Component library based on Radix UI primitives
- Toast notifications for user feedback
- Loading states and error handling

### API Structure
- RESTful API design with Express routes
- Type-safe request/response handling
- Error middleware for consistent error responses
- Request logging and performance monitoring

## Data Flow

### Authentication Flow
1. User initiates login via Replit Auth
2. OIDC discovery and token exchange
3. User session created in PostgreSQL
4. Frontend receives user data via `/api/auth/user`

### Course Interaction Flow
1. User views single masterclass course on homepage
2. Fixed-price course requires purchase for access
3. Enrollment creates progress tracking records
4. Progress updates sync to database
5. "More courses coming soon" messaging builds anticipation for future offerings

### Forum Interaction Flow
1. Anyone can read forum posts and replies without signing in
2. Creating posts and replies requires user authentication
3. Voting on posts/replies requires authentication
4. Posts organized by categories with filtering options
5. Real-time vote counts and reply tracking
6. Automatic user redirection to login when authentication needed

### Data Persistence
- All user data stored in PostgreSQL
- Session data managed by connect-pg-simple
- Course progress tracked per user/course combination
- Purchase records maintain access rights

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Environment**: Requires DATABASE_URL configuration

### Authentication
- **Replit Auth**: Integrated identity provider
- **Dependencies**: OpenID Connect client, session management

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library
- **Tailwind CSS**: Utility-first styling
- **Date-fns**: Date manipulation utilities

### Development Tools
- **Vite**: Build tool with HMR support
- **TypeScript**: Type safety across the stack
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- TSX for TypeScript execution in development
- Express middleware for API serving
- Shared TypeScript configuration for consistency

### Production Build
- Vite builds optimized frontend bundle
- ESBuild compiles server code for Node.js
- Static assets served from Express
- Environment-based configuration

### Database Management
- Drizzle Kit for schema migrations
- `db:push` command for development schema updates
- Connection pooling via Neon's serverless architecture

### Environment Configuration
- **Development**: NODE_ENV=development with TSX
- **Production**: NODE_ENV=production with compiled assets
- **Database**: Automatic Neon PostgreSQL provisioning
- **Authentication**: Replit-specific OIDC configuration

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling efficient development and deployment while maintaining type safety throughout the stack.

## Recent Changes (July 2025)
- **Homepage Restructure**: Transformed from multi-course catalog to single masterclass focus
- **Business Model**: Changed from free/premium tiers to single fixed-price course ($49)
- **Course Content**: Focused on everyday computer usage and troubleshooting (task manager, printer setup, router access, etc.)
- **Future Expansion**: Added "More courses coming soon" messaging for Advanced Security, Hardware Diagnostics, and Enterprise Support
- **Admin Navigation**: Added back buttons to course and blog management pages for improved UX
- **Landing Page Updates**: Moved "Enroll Now" CTA lower on page, reduced price from $97 to $49, simplified hero section
- **Account Management System**: Implemented comprehensive permission system with 5 levels (Member, Blog Admin, Course Admin, Forum Moderator, Super Admin) - Super Admin has exclusive access to account management interface
- **Profile System**: Complete profile page with display name editing and profile picture upload functionality
- **Course Access Management**: Enhanced account management to show user enrollments and purchases, with ability to grant course access without payment