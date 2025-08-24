# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

### Development Workflow

- Make sure to use Svelte 5 syntax/runes (not Svelte 4) or deprecated one.
- When using `lucide icon`, make sure to use/import `@lucide/svelte` package for Svelte 5, not an old `lucide-svelte` package (for Svelte 4 only).

### Svelte 5 & SvelteKit Development Rules

#### **Props Declaration**

- DO: Use `$props()` for component props
- DO: Use `$props()` with TypeScript interfaces
- DON'T: Use `export let` or inline prop types

#### **State Management**

- DO: Use `$state()` for all reactive variables
- DO: Use `$state.raw()` for non-reactive references
- DON'T: Use regular variables for reactive state

#### **Derived Values**

- DO: Use `$derived()` for computed values
- DON'T: Use `$:` reactive statements

#### **Effects and Lifecycle**

- DO: Use `$effect()` for side effects
- DO: Use `$effect.pre()` for pre-render effects
- DON'T: Use `onMount`, `onDestroy`, etc.
- DON'T: Use lifecycle functions

#### **Event Handling**

- DO: Use lowercase event attributes
- DO: Type event handlers properly
- DON'T: Use `on:` directive

#### **Two-way Binding**

- DO: Use `bind:` with state variables
- DO: Use `$bindable()` for component props

#### **Component-Local State**

- DO: Replace writable stores with `$state()`
- DO: Replace `writable` stores with `$state()` for component-local state
- DON'T: Use `writable` stores for component-local state

#### **Global/Shared State**

- DO: Use stores for cross-component state

#### **Load Functions**

- DO: Use typed load functions with Svelte 5

#### **Server-Side Functions**

- DO: Use proper typing for server functions

#### **Form Actions with Svelte 5**

- DO: Use enhanced forms with state
- DO: Use named functions instead of inline handlers
- DON'T: Use inline arrow functions or deprecated modifiers

#### **Props with Children**

- DO: Use snippets for component children

#### **Event Dispatching Pattern**

- DO: Use callback props
- DON'T: Use createEventDispatcher

#### **Import Statements**

- DO: Import only necessary Svelte 5 functions
- DON'T: Import Svelte 4 lifecycle or utility functions

#### **Dynamic Component Rendering**

- DO: Use conditional rendering for dynamic components
- DO: Import all possible components at the top
- DON'T: Use `<svelte:component>` for dynamic components

### Better Auth

- Use Context7 MCP to get the latest and correct Better Auth settings/flows.

### Lucide Icons for Svelte 5

- DO: Use `@lucide/svelte` package for Svelte 5

```bash
# Install the correct package for Svelte 5
npm install @lucide/svelte
```

- DO: Import icons correctly from `@lucide/svelte`

```typescript
// Correct import for Svelte 5
import { Home, Settings, User, Menu, X } from '@lucide/svelte';
// Or import the component wrapper
import Lucide from '@lucide/svelte';
```

- DON'T: Use the old `lucide-svelte` package (Svelte 4 only)

```typescript
// NEVER use this for Svelte 5 - this is for Svelte 4 only
import { Home } from '@lucide/svelte';
import Lucide from '@lucide/svelte';
```

### Core SEO Implementation Rules

#### **Meta Tags & Head Management**

- Always implement dynamic meta tags using `<svelte:head>` in `+page.svelte` files
- Include title, description, og:tags, Twitter cards for every route
- Use SvelteKit's `$app/stores` for canonical URLs
- Implement structured data (JSON-LD) for rich snippets
- Create reusable SEO components for consistent meta tag management.

#### **Server-Side Rendering (SSR)**

- Default to SSR for all public-facing pages (`export const ssr = true`)
- Only disable SSR for authenticated/dashboard routes
- Use `+page.server.ts` for data fetching to ensure content is rendered server-side

#### **Performance Optimization**

- Implement lazy loading for images using `loading="lazy"`
- Use Vite's code splitting with dynamic imports
- Optimize images with appropriate formats (WebP, AVIF) and srcset
- Keep bundle sizes minimal with tree-shaking

#### **URL Structure**

- Create clean, descriptive URLs using SvelteKit's routing
- Use hyphens in URLs, not underscores
- Keep URLs lowercase and consistent

#### **Core Web Vitals**

- Optimize Largest Contentful Paint (LCP) with preloading
- Minimize Cumulative Layout Shift (CLS) with explicit dimensions
- Reduce First Input Delay (FID) with code splitting
- Use `rel="preconnect"` for external domains

#### **Content & Accessibility**

- Implement proper heading hierarchy (h1-h6)
- Add descriptive alt text for all images
- Ensure ARIA labels for interactive elements
- Maintain 4.5:1 contrast ratio for text

#### **Link Management**

- Use `rel="nofollow noopener"` and `target="_blank"` for external/untrusted links
- Implement internal linking strategy
- Add `rel="sponsored"` for affiliate links
- Use descriptive anchor text

#### **Mobile Optimization**

- Ensure responsive design with viewport meta tag
- Test with mobile-first approach
- Optimize touch targets (minimum 44x44px)

#### **Performance Metrics Targets**

| Metric  | Target  | Critical |
| ------- | ------- | -------- |
| **LCP** | < 2.5s  | < 4.0s   |
| **FID** | < 100ms | < 300ms  |
| **CLS** | < 0.1   | < 0.25   |
| **TTI** | < 3.8s  | < 7.3s   |
| **FCP** | < 1.8s  | < 3.0s   |

#### **Common Pitfalls to Avoid**

1. **Don't disable SSR globally** - Only for specific auth-required routes
2. **Don't block CSS/JS in robots.txt** - Search engines need these for rendering
3. **Don't ignore Core Web Vitals** - They directly impact rankings
4. **Don't forget image optimization** - Large images kill performance
