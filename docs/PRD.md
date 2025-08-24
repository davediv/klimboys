# Product Requirements Document (PRD)

## Klimboys - Milk Shake Store Management System

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft  
**Author:** Product Team

---

## 📋 Executive Summary

### Product Vision

Build a lightweight, fast, and intuitive Point of Sale (POS) dashboard for Klimboys milk shake store that enables efficient transaction processing and provides actionable business insights, without payment processing complexity.

### MVP Philosophy

**Ship Fast → Learn → Iterate**

- Launch with core transaction and inventory features
- Gather user feedback within 2 weeks of deployment
- Iterate based on actual usage patterns
- Add advanced features based on validated needs

### Success Metrics

- **Transaction Speed:** < 30 seconds per order
- **System Uptime:** 99.9%
- **User Adoption:** 100% staff usage within 1 week
- **Data Accuracy:** Zero inventory discrepancies

---

## 🎯 Goals & Objectives

### Business Goals

1. **Immediate (MVP - Week 1-4)**
   - Replace manual transaction recording
   - Enable real-time inventory tracking
   - Provide daily sales visibility

2. **Short-term (Post-MVP - Month 2-3)**
   - Optimize operations based on data insights
   - Reduce stock wastage by 20%
   - Increase transaction speed by 30%

3. **Long-term (Month 4+)**
   - Scale to multiple outlets
   - Integrate with delivery platforms
   - Predictive inventory management

---

## 👥 User Personas

### Persona 1: Admin (Store Owner)

- **Name:** Budi (Store Owner)
- **Age:** 35
- **Tech Savvy:** Medium
- **Needs:**
  - Quick overview of daily performance
  - Inventory control
  - Profit margin visibility
- **Pain Points:**
  - Manual calculation of profits
  - No visibility on best sellers
  - Stock running out unexpectedly

### Persona 2: Cashier

- **Name:** Sarah (Part-time Staff)
- **Age:** 22
- **Tech Savvy:** High
- **Needs:**
  - Fast order input
  - Clear product catalog
  - Simple interface
- **Pain Points:**
  - Remembering prices for different sizes
  - Manual order recording
  - Calculating totals

---

## 🚀 MVP Scope (Phase 1 - 4 Weeks)

### Core Features

#### 1. Authentication System

#### 2. Product Management (Admin Only)

```
User Story: As an admin, I want to manage products so that cashiers can process transactions
```

**Acceptance Criteria:**

- [ ] Add product with: Name, Description, Image (R2), Category
- [ ] Set prices per size (S/M/L with ml indication)
- [ ] Set product cost and selling price
- [ ] Mark product as active/inactive
- [ ] Edit existing products
- [ ] View product list with search/filter

**Database Schema:**

```sql
-- products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- product_variants table (for sizes)
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL, -- 'S', 'M', 'L'
  volume_ml INTEGER NOT NULL, -- 250, 350, 500
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 3. Transaction Processing (All Users)

```
User Story: As a cashier, I want to quickly process orders so customers don't wait long
```

**Acceptance Criteria:**

- [ ] Product search with autocomplete
- [ ] Add multiple items to cart
- [ ] Select size for each item
- [ ] Specify quantity
- [ ] Select channel (GrabFood, GoFood, ShopeeFood, UberEats, Store)
- [ ] Select payment method (Cash, QRIS, Transfer, etc.)
- [ ] Add order notes
- [ ] Calculate total automatically
- [ ] Save transaction and deduct stock

**UI Component Structure:**

```svelte
<!-- src/routes/(app)/transaction/+page.svelte -->
<script lang="ts">
	import { ShoppingCart, Search } from '@lucide/svelte';
	let cart = $state<CartItem[]>([]);
	let searchQuery = $state('');

	// Svelte 5 reactive
	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
</script>
```

#### 4. Basic Dashboard (Admin Only)

```
User Story: As an admin, I want to see today's performance at a glance
```

**Acceptance Criteria:**

- [ ] Today's revenue card
- [ ] Total transactions count
- [ ] Top 5 selling products list
- [ ] Low stock alerts (< 10 items)
- [ ] Recent transactions table

**API Endpoints:**

```typescript
// src/routes/api/dashboard/+server.ts
export async function GET({ locals }) {
	const today = new Date().toISOString().split('T')[0];

	const stats = await db
		.select({
			revenue: sum(transactions.total),
			count: count(transactions.id)
		})
		.from(transactions)
		.where(eq(date(transactions.created_at), today));

	return json(stats);
}
```

#### 5. Basic Inventory Management

```
User Story: As an admin, I want to track stock so I never run out of popular items
```

**Acceptance Criteria:**

- [ ] View current stock per product/size
- [ ] Adjust stock manually with reason
- [ ] Automatic stock deduction on sale
- [ ] Stock history log
- [ ] Low stock indicator (< 10 units)

### Technical Architecture

#### Configuration Files

**app.css (TailwindCSS v4):**

```css
@import 'tailwindcss';
@import 'daisyui';

/* Custom theme */
@theme {
	--color-primary: #ff6b6b;
	--color-secondary: #4ecdc4;
	--font-family-sans: 'Inter', system-ui, sans-serif;
}
```

---

## 📊 Database Design (MVP)

### Core Tables

```sql
-- products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- product_variants
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  size TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  UNIQUE(product_id, size)
);

-- transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  transaction_code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  channel TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- transaction_items
CREATE TABLE transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  product_variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- inventory_logs
CREATE TABLE inventory_logs (
  id TEXT PRIMARY KEY,
  product_variant_id TEXT NOT NULL REFERENCES product_variants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'sale', 'adjustment', 'restock'
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 UI/UX Specifications

### Design System

#### Colors (DaisyUI Theme)

```javascript
{
  primary: "#FF6B6B",      // Strawberry red
  secondary: "#4ECDC4",    // Mint green
  accent: "#FFE66D",       // Cream yellow
  neutral: "#2D3436",      // Dark gray
  base-100: "#FFFFFF",     // White background
  info: "#3498DB",
  success: "#27AE60",
  warning: "#F39C12",
  error: "#E74C3C"
}
```

#### Typography

- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Numbers:** Tabular nums for alignment

### Key Screens (MVP)

#### 1. Login Screen

```
┌──────────────────────────┐
│      Klimboys Logo       │
│                          │
│  ┌────────────────────┐  │
│  │ Email              │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ Password           │  │
│  └────────────────────┘  │
│                          │
│  [    Login Button    ]  │
└──────────────────────────┘
```

#### 2. Transaction Screen (Cashier View)

```
┌─────────────┬──────────────┐
│  Product    │    Cart      │
│  Search     │              │
│ ┌─────────┐ │ ┌──────────┐ │
│ │[Search] │ │ │ Item 1   │ │
│ └─────────┘ │ │ M - 2x   │ │
│             │ │ Rp 30,000│ │
│ [Product]   │ └──────────┘ │
│ [Product]   │              │
│ [Product]   │ Channel: [ ] │
│ [Product]   │ Payment: [ ] │
│             │              │
│             │ Total: 30,000│
│             │ [Process]    │
└─────────────┴──────────────┘
```

#### 3. Dashboard (Admin View)

```
┌────────────────────────────┐
│  Today: Rp 1,250,000       │
│  Orders: 45  Avg: 27,777   │
├────────────────────────────┤
│  Top Products              │
│  1. Chocolate - 15 sold    │
│  2. Vanilla - 12 sold      │
│  3. Strawberry - 10 sold   │
├────────────────────────────┤
│  Low Stock Alerts          │
│  ⚠ Vanilla (M) - 5 left   │
│  ⚠ Cookies (L) - 3 left   │
└────────────────────────────┘
```

---

## 🔄 API Specifications

### RESTful Endpoints (MVP)

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

// Products (Admin only)
GET    /api/products                 // List all
POST   /api/products                 // Create
PUT    /api/products/:id            // Update
DELETE /api/products/:id            // Delete
POST   /api/products/:id/image      // Upload image to R2

// Transactions
POST   /api/transactions            // Create transaction
GET    /api/transactions            // List (admin: all, cashier: own)
GET    /api/transactions/:id        // Get details

// Dashboard (Admin only)
GET    /api/dashboard/stats         // Today's stats
GET    /api/dashboard/top-products  // Top selling

// Inventory
GET    /api/inventory               // Current stock
POST   /api/inventory/adjust        // Manual adjustment
```

### Response Format

```typescript
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
	meta?: {
		page?: number;
		total?: number;
	};
}
```

---

## 📅 Development Roadmap

### Phase 1: MVP (Weeks 1-4)

**Goal: Basic operational system**

#### Week 1: Foundation

- [ ] Project setup with all dependencies
- [ ] D1 database schema and migrations
- [ ] Better Auth integration
- [ ] Basic routing and layouts

#### Week 2: Core Features

- [ ] Product CRUD with R2 image upload
- [ ] Product variant management
- [ ] Basic inventory tracking

#### Week 3: Transaction Flow

- [ ] Transaction screen UI
- [ ] Cart functionality
- [ ] Order processing
- [ ] Stock deduction

#### Week 4: Dashboard & Polish

- [ ] Admin dashboard
- [ ] Basic analytics
- [ ] Bug fixes and testing
- [ ] Deployment to Cloudflare Pages

### Phase 2: Enhancements (Weeks 5-8)

**Goal: Improve UX and add analytics**

- [ ] Advanced analytics with Chart.js
- [ ] Sales reports with date ranges
- [ ] Bulk product operations
- [ ] Transaction void/refund
- [ ] Print receipt functionality
- [ ] Mobile optimizations

### Phase 3: Scale (Weeks 9-12)

**Goal: Advanced features based on feedback**

- [ ] Customer data collection
- [ ] Loyalty program
- [ ] Expense tracking
- [ ] Multi-language support
- [ ] API for external integrations
- [ ] Predictive inventory

---

## 🧪 Testing Strategy

### MVP Testing Checklist

#### Functional Testing

- [ ] Login works for both roles
- [ ] Products can be added/edited
- [ ] Images upload to R2
- [ ] Transactions process correctly
- [ ] Stock updates automatically
- [ ] Dashboard shows correct data

#### User Acceptance Testing

- [ ] Cashier can process order in < 30 seconds
- [ ] Admin can add product in < 1 minute
- [ ] All prices calculate correctly
- [ ] Stock never goes negative
- [ ] Jakarta timezone displays correctly

#### Performance Testing

- [ ] Page load < 2 seconds
- [ ] Transaction save < 1 second
- [ ] Image upload < 3 seconds
- [ ] Dashboard refresh < 2 seconds

---

## 🚦 Success Criteria

### MVP Launch Criteria

1. **Core Functions Work:** All MVP features operational
2. **Data Integrity:** No calculation errors
3. **Performance:** Meets speed requirements
4. **Security:** Authentication and authorization work
5. **Mobile Ready:** Responsive on tablet/phone

### Post-Launch Metrics (Week 1)

- Daily active users: 100%
- Transactions processed: > 50/day
- System errors: < 1%
- User feedback score: > 4/5

---

## 🛡️ Security Considerations

### MVP Security Requirements

1. **Authentication:** Secure password hashing (Better Auth handles this)
2. **Authorization:** Role-based access control
3. **Data Protection:** HTTPS only (Cloudflare provides)
4. **Input Validation:** Sanitize all user inputs
5. **SQL Injection:** Use Drizzle ORM parameterized queries
6. **File Upload:** Validate image types and sizes
7. **Rate Limiting:** Cloudflare WAF rules

---

## 📝 Development Guidelines

### Code Standards

```typescript
// Use Svelte 5 runes
let count = $state(0);
let double = $derived(count * 2);

// Use proper TypeScript types
interface Product {
	id: string;
	name: string;
	variants: ProductVariant[];
}

// Use @lucide/svelte for icons
import { ShoppingCart } from '@lucide/svelte';

// Format currency consistently
export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(amount);
}
```

---

## 🤝 Stakeholder Sign-off

| Role          | Name | Approval | Date |
| ------------- | ---- | -------- | ---- |
| Product Owner | -    | ⬜       | -    |
| Tech Lead     | -    | ⬜       | -    |
| Design Lead   | -    | ⬜       | -    |
| QA Lead       | -    | ⬜       | -    |

---

## 📎 Appendices

### A. Competitor Analysis

- **Moka POS:** Full featured but expensive
- **Pawoon:** Good but complex for small business
- **Our Advantage:** Simplified, milk shake specific, affordable

### B. Technical Decisions

- **Why D1:** Serverless, automatic scaling, cost-effective
- **Why R2:** Cheap object storage, Cloudflare integrated
- **Why SvelteKit:** Fast, modern, great DX
- **Why Better Auth:** Simple, supports D1, role-based

### C. Risk Mitigation

| Risk            | Impact | Mitigation          |
| --------------- | ------ | ------------------- |
| Data loss       | High   | Daily D1 backups    |
| Slow adoption   | Medium | Training sessions   |
| Technical bugs  | Medium | Staging environment |
| Security breach | High   | Regular audits      |

---

**Document Version History:**

- v1.0 - Initial PRD (January 2025)

**Next Steps:**

1. Review and approve PRD
2. Set up development environment
3. Begin Week 1 implementation
4. Daily standups during development
5. Weekly demos to stakeholders

---

_This PRD is a living document. Updates will be made based on user feedback and learnings during development._
