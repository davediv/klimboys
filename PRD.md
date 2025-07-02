# Klimboys Milk Shake Store Dashboard

## 1. Project Overview

### 1.1 Purpose

Develop an interactive web-based dashboard for Klimboys milk shake store to manage products, inventory, transactions, and customer relationships. The system functions as a Point of Sale (POS) without payment processing integration.

### 1.2 Objectives

- Real-time inventory and sales tracking
- Multi-role access control (Admin/Cashier)
- Comprehensive analytics and reporting
- Customer relationship management
- Mobile-optimized experience with offline capabilities

### 1.3 Tech Stack

- **Frontend**: Svelte 5, SvelteKit, TypeScript, TailwindCSS v4, DaisyUI v5
- **Backend**: SvelteKit (API routes)
- **Database**: Cloudflare D1
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **File Storage**: Cloudflare R2
- **Charts**: Chart.js
- **Icons**: Lucide Svelte
- **Deployment**: Cloudflare Pages
- **Notifications**: Telegram Bot API

## 2. User Roles & Permissions

### 2.1 Admin Role

- Full system access
- Product management (CRUD operations)
- Inventory management
- View all analytics and reports
- User management (create/manage cashier accounts)
- Customer relationship management
- Export and reporting features
- View product costs and profit margins

### 2.2 Cashier Role

- Create transactions
- View products (without cost information)
- View own sales performance
- Access transaction history (own transactions)
- Cannot access inventory, analytics, or admin features

## 3. Core Features

### 3.1 Authentication & User Management

#### Requirements:

- Secure login system using Better Auth
- Session management with JWT tokens
- Role-based access control (RBAC)
- Admin can create/edit/delete cashier accounts
- Password reset functionality
- Activity logging for security audit

#### Data Structure:

```typescript
interface User {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'cashier';
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt: Date;
}
```

### 3.2 Product Management (Admin Only)

#### Requirements:

- Add/Edit/Delete products
- Single product image upload to Cloudflare R2
- Product availability toggle
- Category management

#### Data Structure:

```typescript
interface Product {
	id: string;
	title: string;
	description: string;
	size: number; // in ml
	productCost: number;
	sellingPrice: number;
	imageUrl: string;
	categoryId: string;
	isAvailable: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface Category {
	id: string;
	name: string;
	description: string;
}
```

### 3.3 Inventory Management (Admin Only)

#### Requirements:

- Track raw materials/ingredients
- Set minimum stock levels
- Automatic stock deduction based on product recipes
- Manual stock adjustment with reason tracking
- Stock movement history

#### Data Structure:

```typescript
interface Inventory {
	id: string;
	name: string;
	unit: string; // ml, g, pcs
	currentStock: number;
	minimumStock: number;
	lastRestockDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface ProductRecipe {
	id: string;
	productId: string;
	inventoryId: string;
	quantity: number;
}

interface StockMovement {
	id: string;
	inventoryId: string;
	type: 'in' | 'out' | 'adjustment';
	quantity: number;
	reason: string;
	transactionId?: string;
	createdBy: string;
	createdAt: Date;
}
```

### 3.4 Transaction Management

#### Requirements:

- Quick product selection interface
- Support multiple items per transaction
- Channel selection (GrabFood, GoFood, ShopeeFood, UberEats, Store)
- Payment method tracking (Cash, QRIS, Transfer, etc.)
- Optional notes per transaction
- Transaction void with reason (Admin only)

#### Data Structure:

```typescript
interface Transaction {
	id: string;
	transactionNumber: string;
	customerId?: string;
	cashierId: string;
	channel: 'grabfood' | 'gofood' | 'shopeefood' | 'ubereats' | 'store';
	paymentMethod: 'cash' | 'qris' | 'transfer' | 'grab' | 'gojek' | 'shopeefood' | 'ubereats';
	totalAmount: number;
	totalCost: number; // Hidden from cashier
	notes?: string;
	status: 'completed' | 'void';
	voidReason?: string;
	createdAt: Date;
}

interface TransactionItem {
	id: string;
	transactionId: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	unitCost: number; // Hidden from cashier
	subtotal: number;
}
```

### 3.5 Customer Relationship Management (Admin Only)

#### Requirements:

- Customer profile management
- Purchase history tracking
- Customer preferences and notes
- Search and filter capabilities

#### Data Structure:

```typescript
interface Customer {
	id: string;
	name: string;
	phone: string;
	address?: string;
	notes?: string;
	totalPurchases: number;
	totalSpent: number;
	lastPurchaseDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}
```

### 3.6 Real-time Features

#### Requirements:

- WebSocket connection for live updates
- Real-time sales dashboard
- Live inventory status updates
- Low stock notifications via Telegram Bot API

#### Implementation:

- Use SvelteKit's built-in WebSocket support
- Implement event-driven updates for transactions and stock changes
- Telegram notification triggers when stock falls below minimum level

### 3.7 Analytics & Reporting (Admin Only)

#### Dashboard Metrics:

- Today's sales and revenue
- Weekly/Monthly comparisons
- Best selling products
- Channel performance
- Peak hours analysis (hourly sales distribution)
- Cashier performance metrics
- Profit margin analysis

#### Reports:

- Daily sales report
- Weekly/Monthly summary
- Inventory status report
- Product performance report
- Channel analysis report

#### Export Options:

- PDF generation using libraries like jsPDF
- Excel/CSV export functionality
- Customizable date ranges

### 3.8 Progressive Web App (PWA)

#### Requirements:

- Service worker for offline functionality
- App manifest for installability
- Offline transaction queue
- Background sync when connection restored
- Push notifications support

## 4. Database Schema (Drizzle ORM)

```typescript
// Example schema structure
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').unique().notNull()
	// ... other fields
});

export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	title: text('title').notNull()
	// ... other fields
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
	transactions: many(transactions)
}));
```

## 5. API Endpoints

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Products

- `GET /api/products` (different response based on role)
- `POST /api/products` (Admin only)
- `PUT /api/products/:id` (Admin only)
- `DELETE /api/products/:id` (Admin only)

### Transactions

- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id/void` (Admin only)

### Inventory

- `GET /api/inventory` (Admin only)
- `POST /api/inventory/adjust` (Admin only)
- `GET /api/inventory/movements` (Admin only)

### Reports

- `GET /api/reports/daily`
- `GET /api/reports/export`
- `GET /api/analytics/dashboard`

### Customers

- `GET /api/customers` (Admin only)
- `POST /api/customers` (Admin only)
- `PUT /api/customers/:id` (Admin only)

## 6. UI/UX Requirements

### Design Principles

- Mobile-first responsive design
- Touch-optimized for tablet use
- High contrast for outdoor/bright environments
- Large touch targets for quick interaction
- Intuitive navigation with role-based menu

### Key Screens

1. **Login Screen**: Simple, secure authentication
2. **Dashboard**: Role-specific overview
3. **Transaction Screen**: Quick product selection, shopping cart view
4. **Products Screen**: Grid/list view with images
5. **Inventory Screen**: Stock levels with visual indicators
6. **Analytics Screen**: Interactive charts and metrics
7. **Reports Screen**: Generate and download reports
8. **Settings Screen**: User management, system preferences

### UI Components (DaisyUI)

- Use DaisyUI's theme system for consistent styling
- Implement dark mode support
- Toast notifications for user feedback
- Modal dialogs for confirmations
- Loading states for all async operations

## 7. Security Requirements

- HTTPS only deployment
- JWT token expiration and refresh
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (handled by Drizzle ORM)
- XSS protection
- CORS configuration
- Audit logging for sensitive operations

## 8. Performance Requirements

- Page load time < 3 seconds on 3G
- Transaction creation < 1 second
- Report generation < 5 seconds
- Support 100+ concurrent users
- Database query optimization
- Image optimization for product photos
- Lazy loading for lists

## 9. Timezone Handling

- All timestamps stored in UTC
- Display conversion to Jakarta time (UTC+7)
- Use date-fns or similar library for timezone handling

## 10. Error Handling

- Graceful error messages for users
- Detailed error logging for debugging
- Fallback UI for critical failures
- Retry mechanisms for network requests
- Offline queue for failed transactions

## 11. Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing
- Security testing

## 12. Future Development Features

### 12.1 Financial Features

- Daily cash reconciliation
- Expense tracking module
- Tax calculation and reporting
- Shift-wise sales summary
- Cash drawer management

### 12.2 Enhanced Analytics

- Predictive analytics for inventory
- Customer segmentation
- Sales forecasting
- Seasonal trend analysis

### 12.3 Integration Possibilities

- Payment gateway integration
- Accounting software sync
- Marketing automation
- Loyalty program system

## 13. Development Phases

### Phase 1: Foundation (Week 1-2)

- Setup project structure
- Implement authentication
- Basic CRUD for products
- Simple transaction creation

### Phase 2: Core Features (Week 3-4)

- Inventory management
- Real-time updates
- Basic analytics
- Role-based access

### Phase 3: Advanced Features (Week 5-6)

- CRM implementation
- Reporting and export
- PWA features
- Telegram notifications

### Phase 4: Polish & Deploy (Week 7-8)

- UI/UX refinement
- Performance optimization
- Testing and bug fixes
- Deployment setup

## 14. Success Metrics

- Transaction processing time < 30 seconds
- Zero data loss for offline transactions
- 99.9% uptime
- User satisfaction score > 4.5/5
- Inventory accuracy > 98%

## 15. Maintenance & Support

- Regular security updates
- Database backups (daily)
- Performance monitoring
- User feedback collection
- Feature update roadmap
