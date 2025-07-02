# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Klimboys is a web-based Point of Sale (POS) dashboard for a milkshake store built with:

- **Frontend**: Svelte 5, SvelteKit, TypeScript, TailwindCSS v4, DaisyUI v5
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: Better Auth
- **Storage**: Cloudflare R2 for images
- **Deployment**: Cloudflare Pages
- **Icons**: Lucide Svelte

## Common Development Commands

```bash
# Development
npm run dev                  # Start development server
npm run build               # Build for production
npm run preview             # Preview production build locally
npm run cf-typegen         # Always run this after change wrangler.jsonc

# Code Quality
npm run lint                # Run linter (Prettier + ESLint)
npm run format              # Auto-fix formatting issues
npm run check               # Type-check with svelte-check
npm run check:watch         # Type-check in watch mode

# Database
npm run db:generate         # Generate Drizzle migrations
npm run db:push             # Push schema changes to D1
npm run db:migrate          # Apply migrations locally
npm run db:remote:migrate   # Apply migrations to remote
npm run db:studio           # Open Drizzle Studio
npm run db:seed             # Seed local database
npm run db:remote:seed      # Seed remote database

# Deployment
npm run deploy              # Deploy to Cloudflare Pages
npm run log                 # View deployment logs
```

## High-Level Architecture

### Authentication Flow

- Uses Better Auth with client (`src/lib/auth.ts`) and server (`src/lib/server/auth.ts`) configurations
- Session-based authentication with JWT tokens
- Database schema includes user, session, account, and verification tables
- Protected routes use `+layout.server.ts` to validate authentication

### Database Architecture

- **Cloudflare D1**: SQLite database accessible via Cloudflare Workers
- **Drizzle ORM**: Type-safe database queries and migrations
- Schema defined in `src/lib/server/db/schema.ts`
- Database connection established in `src/lib/server/db/index.ts`
- Migrations stored in `drizzle/migrations/`

### Component Architecture

- Reusable components in `src/lib/components/`
- Key components: Button (with extensive variant support), DashboardLayout components, NotificationToast, ThemeToggle
- Components use Svelte 5's runes (`$state`, `$derived`, `$effect`)
- All components are TypeScript-enabled with proper prop typing

### Store Management

- Reactive stores in `src/lib/stores/`:
  - `notifications.ts`: Global notification system
  - `theme.ts`: Theme management (light/dark mode)
- Stores use Svelte 5's new state management patterns

### Utility Functions

- `datetime.ts`: Comprehensive Jakarta timezone handling with Indonesian localization
- `notifications.ts`: Helper functions for notification system
- Server-specific utilities in `src/lib/server/`:
  - `telegram.ts`: Telegram bot integration for notifications
  - `teams.ts`: Team management logic

### Routing Structure

- Public routes: `/`, `/login`, `/register`
- Protected routes: `/dashboard/*` (requires authentication)
- API routes: `/api/auth/*` (handled by Better Auth)

### Cloudflare Integration

- **D1 Database**: Bound as `DB` in platform object
- **R2 Storage**: Bound as `BUCKET` for file uploads
- Configuration in `wrangler.jsonc`
- Type definitions in `src/worker-configuration.d.ts` and `app.d.ts`

### Build Pipeline

- Vite for bundling with SvelteKit plugin
- TailwindCSS v4 integrated via Vite plugin
- TypeScript with strict mode enabled
- Cloudflare adapter for deployment

## Key Implementation Details

### Multi-Role System

The PRD specifies Admin and Cashier roles with different permissions:

- Admins: Full access including costs, analytics, inventory
- Cashiers: Limited to transaction creation and viewing

### Transaction Channels

Supports multiple delivery channels: GrabFood, GoFood, ShopeeFood, UberEats, Store

### Real-time Features

Plans for WebSocket connections for live updates (not yet implemented)

### Progressive Web App

PWA capabilities planned but not yet implemented

### Notification System

Telegram bot integration ready for alerts and daily reports

## Development Workflow

1. Always format code before committing: `npm run format && npm run lint`
2. Use `npm run check` to ensure TypeScript types are correct
3. Use consistent input styling
4. Design touch-friendly interfaces for mobile
5. Use the `createDB(d1)` function to access the database
6. Follow existing Tailwind/DaisyUI patterns for styling
7. TypeScript strict mode is enabled - ensure proper typing
8. Use semantic HTML elements and ARIA attributes appropriately
9. Create reusable component with consistent patterns
10. Make sure to use Svelte 5 syntax/runes (not Svelte 4) or deprecated one.
11. Provide clear, accessible error messages
12. Implement accessible DaisyUI modals with proper accessibility and focus trapping
13. Lazy load heavy components
14. Use Sveltekit preload data on "hover"
15. Use prepared statements on database for repeated queries
16. Use indexed search for large datasets
17. Maintain consistency UI across all components and pages
18. Maintain readable line heights (1.5 for body, 1.2 for headings)
19. Use consistent type scale with DaisyUI's text utilities
20. Provide clear error messages and loading states
21. Use Lucide icons consistently with proper sizing
22. Implement a consistent notification system
23. Database queries should be in `src/lib/server/` only
24. When adding git commit message, disable Co Authored attribution (includeCoAuthoredBy): "Remove 🤖 Generated with [Claude Code](https://claude.ai/code)" and "Remove Co-Authored-By: Claude <noreply@anthropic.com>"

## Svelte 5 Syntax Enforcement

This rule ensures all Svelte code uses Svelte 5 syntax patterns and prevents legacy Svelte 4 syntax.

#### **Props Declaration**

- **✅ DO: Use `$props()` for component props**

  ```typescript
  let {
  	title = 'Default Title',
  	count = 0,
  	onchange = () => {}
  }: {
  	title?: string;
  	count?: number;
  	onchange?: (value: number) => void;
  } = $props();
  ```

- **❌ DON'T: Use `export let` for props**
  ```typescript
  // Svelte 4 syntax - avoid
  export let title = 'Default Title';
  export let count = 0;
  export let onchange = () => {};
  ```

#### **State Management**

- **✅ DO: Use `$state()` for reactive variables**

  ```typescript
  let count = $state(0);
  let items = $state<Item[]>([]);
  let isLoading = $state(false);
  ```

- **❌ DON'T: Use regular variables for reactive state**
  ```typescript
  // Svelte 4 syntax - avoid
  let count = 0;
  let items = [];
  let isLoading = false;
  ```

#### **Event Handlers**

- **✅ DO: Use lowercase event handler attributes**

  ```svelte
  <button onclick={handleClick}>Click me</button>
  <form onsubmit={handleSubmit}>
  <input onchange={handleChange} />
  <div onkeydown={handleKeydown}>
  <svelte:window onkeydown={handleGlobalKeydown} />
  ```

- **❌ DON'T: Use `on:` directive syntax**
  ```svelte
  <!-- Svelte 4 syntax - avoid -->
  <button on:click={handleClick}>Click me</button>
  <form on:submit={handleSubmit}>
  <input on:change={handleChange} />
  <div on:keydown={handleKeydown}>
  <svelte:window on:keydown={handleGlobalKeydown} />
  ```

#### **Reactive Statements and Effects**

- **✅ DO: Use `$effect()` for side effects**

  ```typescript
  $effect(() => {
  	// Side effect logic
  	console.log('Component mounted or dependencies changed');

  	return () => {
  		// Cleanup logic
  		console.log('Cleanup');
  	};
  });
  ```

- **✅ DO: Use `$derived()` for computed values**

  ```typescript
  const fullName = $derived(`${firstName} ${lastName}`);
  const isValid = $derived(email.includes('@') && password.length > 6);
  ```

- **❌ DON'T: Use `$:` reactive statements**
  ```typescript
  // Svelte 4 syntax - avoid
  $: fullName = `${firstName} ${lastName}`;
  $: console.log('Count changed:', count);
  ```

#### **Event Dispatching**

- **✅ DO: Use callback props instead of event dispatchers**

  ```typescript
  // Component definition
  let {
  	onsubmit = () => {},
  	oncancel = () => {},
  	onsave = (data: any) => {}
  }: {
  	onsubmit?: () => void;
  	oncancel?: () => void;
  	onsave?: (data: any) => void;
  } = $props();

  // Usage
  function handleSave() {
  	onsave(formData);
  }
  ```

- **❌ DON'T: Use `createEventDispatcher()`**

  ```typescript
  // Svelte 4 syntax - avoid
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleSave() {
  	dispatch('save', formData);
  }
  ```

#### **Lifecycle Functions**

- **✅ DO: Use `$effect()` instead of lifecycle functions**

  ```typescript
  // Mount effect
  $effect(() => {
  	// Equivalent to onMount
  	fetchData();
  });

  // Cleanup effect
  $effect(() => {
  	const interval = setInterval(updateTime, 1000);

  	return () => {
  		clearInterval(interval);
  	};
  });
  ```

- **❌ DON'T: Use `onMount`, `onDestroy`, etc.**

  ```typescript
  // Svelte 4 syntax - avoid
  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
  	fetchData();
  });

  onDestroy(() => {
  	cleanup();
  });
  ```

#### **Bindable Props**

- **✅ DO: Use `$bindable()` for two-way binding**
  ```typescript
  let {
  	value = $bindable(''),
  	isOpen = $bindable(false)
  }: {
  	value?: string;
  	isOpen?: boolean;
  } = $props();
  ```

#### **Import Statements**

- **✅ DO: Import only necessary Svelte 5 functions**

  ```typescript
  import { tick } from 'svelte';
  // No need to import onMount, createEventDispatcher, etc.
  ```

- **❌ DON'T: Import Svelte 4 lifecycle or utility functions**
  ```typescript
  // Avoid these imports in Svelte 5
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  ```

#### **Component Structure Example**

```typescript
<script lang="ts">
  // Props with TypeScript typing
  let {
    title = 'Default',
    items = [],
    onitemclick = () => {}
  }: {
    title?: string;
    items?: Item[];
    onitemclick?: (item: Item) => void;
  } = $props();

  // State variables
  let selectedItem = $state<Item | null>(null);
  let isLoading = $state(false);

  // Derived values
  const itemCount = $derived(items.length);
  const hasItems = $derived(items.length > 0);

  // Effects
  $effect(() => {
    if (selectedItem) {
      console.log('Selected:', selectedItem);
    }
  });

  // Event handlers
  function handleItemClick(item: Item) {
    selectedItem = item;
    onitemclick(item);
  }
</script>

<div>
  <h2>{title}</h2>
  {#if hasItems}
    {#each items as item (item.id)}
      <button onclick={() => handleItemClick(item)}>
        {item.name}
      </button>
    {/each}
  {/if}
</div>
```

#### **Slot vs Render Syntax**

- **✅ DO: Use `{@render children()}` for component content**

  ```svelte
  <script lang="ts">
  	import type { Snippet } from 'svelte';

  	let {
  		title = 'Default',
  		children
  	}: {
  		title?: string;
  		children?: Snippet;
  	} = $props();
  </script>

  <div>
  	<h2>{title}</h2>
  	{#if children}
  		{@render children()}
  	{/if}
  </div>
  ```

- **✅ DO: Use named snippets for multiple content areas**

  ```svelte
  <script lang="ts">
  	import type { Snippet } from 'svelte';

  	let {
  		header,
  		content,
  		footer
  	}: {
  		header?: Snippet;
  		content?: Snippet;
  		footer?: Snippet;
  	} = $props();
  </script>

  <div class="card">
  	{#if header}
  		<div class="card-header">
  			{@render header()}
  		</div>
  	{/if}

  	{#if content}
  		<div class="card-body">
  			{@render content()}
  		</div>
  	{/if}

  	{#if footer}
  		<div class="card-footer">
  			{@render footer()}
  		</div>
  	{/if}
  </div>
  ```

- **❌ DON'T: Mix `<slot>` and `{@render}` syntax in the same component**

  ```svelte
  <!-- This will cause an error -->
  <div>
  	{#if children}
  		{@render children()}
  	{/if}
  	<slot />
  	<!-- ERROR: Cannot mix slot and render syntax -->
  </div>
  ```

- **❌ DON'T: Use legacy `<slot>` syntax in Svelte 5**

  ```svelte
  <!-- Svelte 4 syntax - avoid -->
  <div>
  	<slot name="header" />
  	<slot />
  	<slot name="footer" />
  </div>
  ```

#### **Lucide Icons for Svelte 5**

- ✅ DO: Use `@lucide/svelte` package for Svelte 5\*\*
  ```bash
  # Install the correct package for Svelte 5
  npm install @lucide/svelte
  ```
- ✅ DO: Import icons correctly from `@lucide/svelte`\*\*

  ```typescript
  // Correct import for Svelte 5
  import { Home, Settings, User, Menu, X } from '@lucide/svelte';

  // Or import the component wrapper
  import Lucide from '@lucide/svelte';
  ```

- ❌ DON'T: Use the old `lucide-svelte` package (Svelte 4 only)\*\*
  ```typescript
  // NEVER use this for Svelte 5 - this is for Svelte 4 only
  import { Home } from '@lucide/svelte';
  import Lucide from '@lucide/svelte';
  ```

#### **SEO and Meta Tags**

- Use Svelte:head component for adding meta information.
- Implement canonical URLs for proper SEO.
- Create reusable SEO components for consistent meta tag management.

## Notification Systems

### Telegram Notifications

Send notifications to Telegram channels or groups using the Telegram Bot API.

#### Telegram Usage

```typescript
// Server-side only (e.g., in +page.server.ts or API routes)
import { sendTelegramNotification, telegramNotify } from '$lib/server/telegram';

// Prize claimed notification
await sendTelegramNotification({
	custName: 'John Doe',
	itemName: 'Vanilla Milkshake',
	buyAt: new Date()
});

// Success notification
await telegramNotify.success('Deployment Complete', 'v1.2.3 deployed successfully');

// Alert notification
await telegramNotify.alert('High CPU Usage', 'Server CPU is above 90%');

// Info notification
await telegramNotify.info('Maintenance', 'Scheduled maintenance at 2 AM');

// Daily report
await telegramNotify.dailyReport({
	totalUsers: 2543,
	totalRevenue: 45623,
	newSignups: 47
});

// Custom message with markdown
import { sendTelegramMessage } from '$lib/server/telegram';

await sendTelegramMessage({
	text: '🚀 *Custom Message*\n\nThis supports **markdown** formatting!',
	parseMode: 'Markdown',
	disableNotification: false
});
```

## Components

### Button Component

A customizable button component that follows DaisyUI v5 and TailwindCSS v4 design patterns with Lucide icon support. The component defaults to the primary variant but supports all DaisyUI button variants.

#### Basic Usage

```svelte
<script>
	import Button from '$lib/components/Button.svelte';
	import { Save, Send, Trash2 } from '@lucide/svelte';
</script>

<!-- Basic button (defaults to primary variant) -->
<Button>Click me</Button>

<!-- Explicit primary variant -->
<Button variant="primary">Primary Button</Button>

<!-- With icon -->
<Button icon={Save}>Save Changes</Button>

<!-- Icon on right -->
<Button icon={Send} iconPosition="right">Send Message</Button>

<!-- Different variants -->
<Button variant="secondary">Secondary</Button>
<Button variant="accent">Accent</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="success">Success</Button>
<Button variant="error">Error</Button>
<Button variant="warning">Warning</Button>
<Button variant="info">Info</Button>

<!-- Sizes -->
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

<!-- Outline style -->
<Button variant="primary" outline>Outline Primary</Button>
<Button variant="error" outline>Outline Error</Button>

<!-- Loading state (automatically disabled and shows disabled color) -->
<Button loading>Loading...</Button>
<Button loading loadingText="Saving...">Save</Button>
<Button loading icon={Save} loadingText="Saving...">Save</Button>
<Button variant="primary" loading loadingText="Processing...">Process</Button>

<!-- Disabled state -->
<Button disabled>Disabled</Button>

<!-- Wide and block buttons -->
<Button wide>Wide Button</Button>
<Button block>Full Width Button</Button>

<!-- Shape variants -->
<Button circle icon={Trash2} />
<Button square icon={Save} />

<!-- Link button -->
<Button href="/dashboard">Go to Dashboard</Button>
<Button href="https://example.com" external>External Link</Button>

<!-- With click handler -->
<Button onclick={() => console.log('Clicked!')}>Click Handler</Button>

<!-- Custom styling -->
<Button class="shadow-lg" icon={Save}>Custom Style</Button>
<Button iconClass="text-yellow-500" icon={Save}>Custom Icon Color</Button>
```

#### Props

| Prop           | Type                                                                                                       | Default        | Description                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `variant`      | `'primary' \| 'secondary' \| 'accent' \| 'ghost' \| 'link' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'primary'`    | Button style variant                                                            |
| `size`         | `'xs' \| 'sm' \| 'md' \| 'lg'`                                                                             | `'md'`         | Button size                                                                     |
| `outline`      | `boolean`                                                                                                  | `false`        | Use outline style                                                               |
| `wide`         | `boolean`                                                                                                  | `false`        | Make button wider                                                               |
| `block`        | `boolean`                                                                                                  | `false`        | Full width button                                                               |
| `circle`       | `boolean`                                                                                                  | `false`        | Circular button                                                                 |
| `square`       | `boolean`                                                                                                  | `false`        | Square button                                                                   |
| `loading`      | `boolean`                                                                                                  | `false`        | Show loading state (automatically disables button and applies disabled styling) |
| `disabled`     | `boolean`                                                                                                  | `false`        | Disable button                                                                  |
| `active`       | `boolean`                                                                                                  | `false`        | Active state                                                                    |
| `glass`        | `boolean`                                                                                                  | `false`        | Glass morphism effect                                                           |
| `noAnimation`  | `boolean`                                                                                                  | `false`        | Disable animations                                                              |
| `href`         | `string`                                                                                                   | `undefined`    | Convert to anchor link                                                          |
| `external`     | `boolean`                                                                                                  | `false`        | Open link in new tab                                                            |
| `icon`         | `ComponentType`                                                                                            | `undefined`    | Lucide icon component                                                           |
| `iconPosition` | `'left' \| 'right'`                                                                                        | `'left'`       | Icon position                                                                   |
| `iconClass`    | `string`                                                                                                   | `''`           | Additional icon classes                                                         |
| `loadingText`  | `string`                                                                                                   | `'Loading...'` | Text shown when loading                                                         |
| `class`        | `string`                                                                                                   | `''`           | Additional CSS classes                                                          |
| `onclick`      | `(e: MouseEvent) => void`                                                                                  | `undefined`    | Click handler                                                                   |

#### Advanced Examples

```svelte
<script>
	import Button from '$lib/components/Button.svelte';
	import { Download, Upload, Check } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';

	let isLoading = $state(false);

	async function handleSave() {
		isLoading = true;
		try {
			await saveData();
			notifications.success('Saved!', 'Your changes have been saved.');
		} catch (error) {
			notifications.error('Error', 'Failed to save changes.');
		} finally {
			isLoading = false;
		}
	}
</script>

<!-- Form submission button -->
<form on:submit|preventDefault={handleSave}>
	<Button
		type="submit"
		loading={isLoading}
		loadingText="Saving changes..."
		icon={Check}
		variant="success"
	>
		Save Changes
	</Button>
</form>

<!-- Button group -->
<div class="btn-group">
	<Button size="sm">Previous</Button>
	<Button size="sm" variant="ghost">1</Button>
	<Button size="sm" active>2</Button>
	<Button size="sm" variant="ghost">3</Button>
	<Button size="sm">Next</Button>
</div>

<!-- Icon-only buttons -->
<div class="flex gap-2">
	<Button circle size="sm" variant="ghost" icon={Download} />
	<Button circle size="sm" variant="ghost" icon={Upload} />
	<Button circle size="sm" variant="error" outline icon={Trash2} />
</div>

<!-- Responsive button -->
<Button class="w-full sm:w-auto" icon={Send} iconPosition="right">Send Message</Button>
```

#### TypeScript Support

The Button component is fully typed. When using TypeScript, you'll get full IntelliSense support:

```typescript
import Button from '$lib/components/Button.svelte';
import type { ComponentProps } from 'svelte';

type ButtonProps = ComponentProps<Button>;

// All HTML button attributes are also supported
const handleClick = (event: MouseEvent) => {
	console.log('Button clicked!', event);
};
```

## Utilities

### DateTime Utility

A comprehensive utility for handling dates and times in Jakarta timezone (Asia/Jakarta). Provides consistent date formatting with Indonesian day and month names.

#### Setup

```typescript
import {
	jakartaTime,
	formatFullDateTime,
	formatDayDate,
	formatDateTime,
	formatTime,
	formatRelativeTime,
	isToday,
	isTomorrow,
	toJakartaTime,
	getCurrentJakartaTime
} from '$lib/utils/datetime';
```

#### Basic Usage

```typescript
// Get current Jakarta time
const now = getCurrentJakartaTime();
console.log(now); // Date object in Jakarta timezone

// Convert any date to Jakarta timezone
const date = new Date('2025-06-25T15:30:00Z');
const jakartaDate = toJakartaTime(date);

// Format examples
const fullFormat = formatFullDateTime(date);
// Output: "Rabu, 25 Jun 2025, 10:30 PM"

const dayDateFormat = formatDayDate(date);
// Output: "Rabu, 25 Jun 2025"

const dateTimeFormat = formatDateTime(date);
// Output: "25 Jun 2025, 10:30 PM"

const timeFormat = formatTime(date);
// Output: "10:30 PM"

// Relative time formatting
const relativeFormat = formatRelativeTime(date);
// Output: "2 hours ago" or "in 3 days"

// Check if date is today or tomorrow
if (isToday(date)) {
	console.log('This is today!');
}

if (isTomorrow(date)) {
	console.log('This is tomorrow!');
}
```

#### Using the jakartaTime Object

The `jakartaTime` object provides convenient access to all formatting functions:

```typescript
import { jakartaTime } from '$lib/utils/datetime';

// Convert to Jakarta timezone
const jakartaDate = jakartaTime.toJakarta(new Date());

// Get current Jakarta time
const now = jakartaTime.current();

// Formatting
const formatted = jakartaTime.full(); // "Rabu, 25 Jun 2025, 10:30 PM"
const dayDate = jakartaTime.dayDate(); // "Rabu, 25 Jun 2025"
const dateTime = jakartaTime.dateTime(); // "25 Jun 2025, 10:30 PM"
const time = jakartaTime.time(); // "10:30 PM"
const relative = jakartaTime.relative(date); // "2 hours ago"

// Checkers
const today = jakartaTime.isToday(date);
const tomorrow = jakartaTime.isTomorrow(date);

// Access constants
console.log(jakartaTime.timezone); // "Asia/Jakarta"
console.log(jakartaTime.days); // ['Minggu', 'Senin', 'Selasa', ...]
console.log(jakartaTime.months); // ['Jan', 'Feb', 'Mar', ...]
```

#### Component Examples

```svelte
<script lang="ts">
	import { jakartaTime } from '$lib/utils/datetime';

	let currentTime = $state(jakartaTime.current());
	let formattedTime = $derived(jakartaTime.full(currentTime));

	// Update time every second
	$effect(() => {
		const interval = setInterval(() => {
			currentTime = jakartaTime.current();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Format a date
	const drawDate = new Date('2025-06-28T19:00:00');
	const isDrawToday = jakartaTime.isToday(drawDate);
	const drawTimeFormatted = jakartaTime.time(drawDate);
</script>

<div>
	<p>Current Jakarta Time: {formattedTime}</p>

	{#if isDrawToday}
		<p>Next draw today at {drawTimeFormatted}</p>
	{:else}
		<p>Next draw: {jakartaTime.relative(drawDate)}</p>
	{/if}
</div>
```

#### Server-Side Usage

```typescript
// In +page.server.ts or API routes
import { jakartaTime } from '$lib/utils/datetime';

export async function load() {
	const draws = await getDraws();

	return {
		draws: draws.map((draw) => ({
			...draw,
			formattedDate: jakartaTime.dayDate(draw.date),
			formattedTime: jakartaTime.time(draw.date),
			isToday: jakartaTime.isToday(draw.date)
		}))
	};
}
```

#### Format Options

| Function     | Example Output                | Description                      |
| ------------ | ----------------------------- | -------------------------------- |
| `full()`     | "Rabu, 25 Jun 2025, 10:30 PM" | Full date with day name and time |
| `dayDate()`  | "Rabu, 25 Jun 2025"           | Date with day name, no time      |
| `dateTime()` | "25 Jun 2025, 10:30 PM"       | Date and time without day name   |
| `time()`     | "10:30 PM"                    | Time only in 12-hour format      |
| `relative()` | "2 hours ago"                 | Relative time (human-readable)   |

#### Notes

- All functions accept `Date`, `string`, or `number` (timestamp) as input
- Functions default to current time if no parameter is provided
- Indonesian day names: Minggu (Sunday) through Sabtu (Saturday)
- Indonesian month abbreviations: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des
- All times are automatically converted to Jakarta timezone (UTC+7)
- Relative time shows actual date for periods longer than 30 days
