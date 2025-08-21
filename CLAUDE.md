# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Klimboys is a comprehensive Point of Sale (POS) dashboard for a milk shake store built with modern web technologies. The system provides real-time inventory tracking, multi-role access control, analytics, and customer relationship management without payment processing integration.

## Tech Stack & Architecture

- **Frontend**: Svelte 5, SvelteKit, TypeScript, TailwindCSS v4, DaisyUI v5
- **Backend**: SvelteKit API routes with server-side rendering
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth with role-based access control
- **File Storage**: Cloudflare R2 for product images
- **Analytics**: Chart.js for data visualization
- **Deployment**: Cloudflare Pages with Workers runtime
- **Notifications**: Telegram Bot API integration

## Common Development Commands

### Development & Building
```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Build and preview locally
npm run check                  # Type check with svelte-check
npm run check:watch            # Type check in watch mode
npm run format                 # Format code with Prettier
npm run lint                   # Run ESLint and Prettier checks
```

### Database Operations
```bash
npm run db:generate            # Generate Drizzle migrations
npm run db:push                # Push schema changes to D1
npm run db:studio              # Open Drizzle Studio
npm run db:migrate             # Apply migrations locally
npm run db:remote:migrate      # Apply migrations to remote D1
npm run db:seed                # Seed local database
npm run db:remote:seed         # Seed remote database
```

### Cloudflare Operations
```bash
npm run deploy                 # Deploy to Cloudflare Pages
npm run log                    # View deployment logs
npm run cf-typegen             # Generate Cloudflare types
```

## Database Schema Architecture

The application uses a comprehensive relational schema with the following key entities:

### Core Tables
- **users**: Authentication with role-based access ('admin' | 'cashier')
- **products**: Product catalog with cost/pricing (cost hidden from cashiers)
- **categories**: Product categorization
- **inventory**: Raw materials/ingredients tracking
- **productRecipe**: Links products to required inventory items
- **transactions**: Sales records with multi-channel support
- **transactionItems**: Individual line items within transactions
- **customers**: Customer profiles and purchase history
- **stockMovement**: Comprehensive audit trail for inventory changes

### Key Relationships
- Products belong to categories and have recipes (inventory requirements)
- Transactions are created by users (cashiers) and contain multiple items
- Stock movements are automatically created on transactions and manual adjustments
- All sensitive operations are logged for audit purposes

## Authentication & Authorization

### Role-Based Access Control (RBAC)
- **Admin Role**: Full system access including costs, analytics, user management
- **Cashier Role**: Limited to transaction creation, cannot see costs or admin features

### Security Features
- Better Auth integration with Drizzle adapter
- Rate limiting on sensitive endpoints (login, register, upload, API)
- Activity logging for security auditing
- Session management with 7-day expiry
- Route guards with automatic redirects
- IP-based tracking and suspicious activity monitoring

### Authentication Flow
1. Users authenticate via Better Auth (email/password)
2. `hooks.server.ts` creates enhanced session with role information
3. Route protection via `requireAuth()`, `requireAdmin()`, `requireCashier()`
4. Data filtering based on role (sensitive fields hidden from cashiers)

## Key Architectural Patterns

### Server-Side Architecture
- SvelteKit's file-based routing with `+page.server.ts` for data loading
- Database operations centralized in `/src/lib/server/db/`
- Authentication logic in `/src/lib/server/auth/`
- Role-based middleware in route `+layout.server.ts` files

### Frontend Architecture  
- Svelte 5 with runes for state management
- Component-based UI with DaisyUI theming
- Reactive stores for notifications and theme management
- Chart.js integration for analytics visualization

### Data Flow Patterns
- Server-side data loading with automatic role-based filtering
- Real-time updates planned via WebSocket integration
- Automatic inventory deduction based on product recipes
- Comprehensive audit trails for all data modifications

## Development Guidelines

### Database Migrations
- Always generate migrations with `npm run db:generate` after schema changes
- Test locally first with `npm run db:migrate` 
- Apply to production with `npm run db:remote:migrate`
- Use Drizzle Studio (`npm run db:studio`) for database inspection

### Role-Based Development
- Use `filterDataByRole()` helper to hide sensitive data from cashiers
- Cost-related fields (productCost, totalCost, unitCost) must be filtered
- Test features with both admin and cashier roles
- Implement proper route guards for admin-only sections

### Cloudflare Integration
- Database binding: `DB` (D1 database)
- Storage binding: `BUCKET` (R2 bucket for images)
- Use `event.platform.env.*` to access bindings in server code
- Generate types with `npm run cf-typegen` after wrangler config changes

### Security Considerations
- All user inputs are validated with Zod schemas
- Rate limiting is enforced on sensitive endpoints
- Activity logging captures security events
- CORS and security headers are configured in hooks
- Never expose cost information to cashier role

### Testing Strategy
- Type checking: `npm run check`
- Linting: `npm run lint`
- Format: `npm run format`
- Always run checks before committing code

## Important File Locations

### Core Configuration
- `/drizzle.config.ts` - Database configuration
- `/wrangler.jsonc` - Cloudflare Workers configuration  
- `/src/hooks.server.ts` - Request handling and security

### Database Layer
- `/src/lib/server/db/schema.ts` - Complete database schema
- `/src/lib/server/db/index.ts` - Database connection
- `/drizzle/migrations/` - Database migration files

### Authentication System
- `/src/lib/server/auth.ts` - Better Auth configuration
- `/src/lib/server/auth/rbac.ts` - Role-based access control
- `/src/lib/server/auth/guards.ts` - Route protection
- `/src/lib/server/auth/rate-limit.ts` - API rate limiting

### Business Logic
- `/src/routes/dashboard/` - Main application routes
- `/src/routes/api/` - API endpoints
- `/src/lib/components/` - Reusable UI components

## Environment Variables & Secrets

The application requires proper configuration of:
- D1 database credentials (configured in wrangler.jsonc)
- R2 bucket access (configured in wrangler.jsonc)
- Better Auth secrets (session keys)
- Telegram Bot API tokens (for notifications)

## Common Troubleshooting

### Database Issues
- Check table existence with D1 console or Drizzle Studio
- Verify migrations are applied: `npm run db:migrate`
- Activity log errors often indicate table creation issues

### Authentication Problems
- Verify Better Auth schema matches database tables
- Check session expiry and refresh logic
- Ensure role-based middleware is properly configured

### Cloudflare Deployment
- Verify wrangler.jsonc bindings match your Cloudflare resources
- Check compatibility_date for breaking changes
- Use `npm run cf-typegen` to ensure type safety