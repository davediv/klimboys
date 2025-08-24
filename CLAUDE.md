# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Klimboys is a web-based Point of Sale (POS) dashboard for a milk shake store built with SvelteKit and deployed on Cloudflare Pages. The application manages products, inventory, transactions, and customer relationships without payment processing integration.

## Development Commands

### Core Development

- `npm run dev` - Start development server on port 5179
- `npm run build` - Build the application for production
- `npm run preview` - Build and preview using Wrangler (Cloudflare Workers runtime)
- `npm run deploy` - Build and deploy to Cloudflare Pages

### Code Quality

- `npm run check` - Run svelte-check for TypeScript checking
- `npm run lint` - Check code formatting and run ESLint
- `npm run format` - Format code with Prettier

### Database Management

- `npm run db:push` - Push schema changes to Cloudflare D1
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

### Cloudflare

- `npm run cf-typegen` - Generate TypeScript types for Cloudflare Workers bindings

## Architecture

### Tech Stack

- **Frontend**: Svelte 5 (runes-based reactivity), TailwindCSS v4, DaisyUI v5
- **Backend**: SvelteKit server-side endpoints
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth library with email/password and role-based access
- **Deployment**: Cloudflare Pages with Workers
- **Storage**: Cloudflare R2 for file storage

### Project Structure

- `/src/lib/server/` - Server-side code (auth, database)
  - `auth.ts` - Better Auth configuration with lazy initialization for Cloudflare Workers
  - `db/` - Database connection and schema definitions
- `/src/routes/` - SvelteKit routes and pages
- `/drizzle/` - Database migrations and metadata
- `wrangler.jsonc` - Cloudflare Workers configuration with D1 and R2 bindings

### Key Patterns

#### Database Initialization

The database uses lazy initialization pattern to work with Cloudflare Workers:

```typescript
// In hooks.server.ts
if (event.platform?.env?.DB) {
	initializeDb(event.platform.env.DB);
}
```

#### Authentication Flow

- Better Auth handles sessions via `/api/auth/*` routes
- Session validation happens in `hooks.server.ts`
- Role-based access with hierarchy: admin > cashier > viewer
- Email verification required for new accounts

#### Cloudflare Bindings

- **DB**: D1 database binding (database_id: 62060a1d-9f63-407d-a0f8-971ad5c4253a)
- **BUCKET**: R2 storage binding (bucket: klimboys-storage)
- **ASSETS**: Static assets binding

### Environment Configuration

- Development runs on `http://localhost:5179`
- Production domains: `https://klimboys.pages.dev`, `https://*.klimboys.pages.dev`
- Compatibility date: 2025-08-23
- Uses Node.js ALS compatibility flag for Better Auth

## Testing Approach

Check README or search codebase for specific test commands as no standard test script is defined in package.json yet.
