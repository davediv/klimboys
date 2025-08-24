# Svelte 4 to Svelte 5 Comprehensive Migration Guide

## Overview

Svelte 5 introduces "runes" - a new reactivity system that replaces the compiler-based reactivity of Svelte 4. This guide covers all aspects of migration.

## Core Migration Checklist

### 1. **Props** - Replace `export let` with `$props()`

```javascript
// Svelte 4
export let name = 'default';
export let age;
export let optional = undefined;

// Svelte 5
let { name = 'default', age, optional = undefined } = $props();

// With TypeScript
interface Props {
  name?: string;
  age: number;
  optional?: string;
}
let { name = 'default', age, optional }: Props = $props();
```

### 2. **State** - Convert reactive variables to `$state()`

```javascript
// Svelte 4
let count = 0;
let user = { name: 'John' };
let items = [];

// Svelte 5
let count = $state(0);
let user = $state({ name: 'John' });
let items = $state([]);
```

### 3. **Stores** - Replace component-local `writable()` with `$state()`

```javascript
// Svelte 4
import { writable } from 'svelte/store';
const count = writable(0);
$count; // auto-subscription
count.set(5);
count.update((n) => n + 1);

// Svelte 5
let count = $state(0);
count; // direct access
count = 5; // direct assignment
count = count + 1; // direct update
```

### 4. **Derived Values** - Replace `$:` with `$derived()` or `$derived.by()`

```javascript
// Svelte 4
$: doubled = count * 2;
$: fullName = `${firstName} ${lastName}`;
$: expensive = heavyComputation(value);

// Svelte 5
let doubled = $derived(count * 2);
let fullName = $derived(`${firstName} ${lastName}`);
let expensive = $derived.by(() => {
	// For complex computations
	return heavyComputation(value);
});
```

### 5. **Effects** - Replace reactive statements and lifecycle hooks with `$effect()`

```javascript
// Svelte 4
import { onMount, onDestroy } from 'svelte';
$: console.log('count changed:', count);
$: {
	document.title = `Count: ${count}`;
}

onMount(() => {
	const interval = setInterval(() => {}, 1000);
	return () => clearInterval(interval);
});

onDestroy(() => {
	cleanup();
});

// Svelte 5
$effect(() => {
	console.log('count changed:', count);
});

$effect(() => {
	document.title = `Count: ${count}`;
});

$effect(() => {
	const interval = setInterval(() => {}, 1000);
	return () => clearInterval(interval); // cleanup function
});
```

### 6. **Events** - Change `on:event` to `onevent`

```javascript
// Svelte 4
<button on:click={handleClick}>Click</button>
<input on:input={handleInput} />
<form on:submit={handleSubmit}>

// Svelte 5
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
<form onsubmit={handleSubmit}>
```

### 7. **Event Modifiers** - Handle in function body

```javascript
// Svelte 4
<button on:click|preventDefault|stopPropagation={handleClick}>
<form on:submit|preventDefault={handleSubmit}>
<input on:keydown|escape={handleEscape}>

// Svelte 5
<button onclick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleClick(e);
}}>

<form onsubmit={(e) => {
  e.preventDefault();
  handleSubmit(e);
}}>

<input onkeydown={(e) => {
  if (e.key === 'Escape') handleEscape(e);
}}>
```

### 8. **Event Dispatching** - Replace with callback props

```javascript
// Svelte 4
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();
dispatch('close', { value: 42 });

// Parent
<Child on:close={handleClose} />;

// Svelte 5
let { onclose } = $props();
onclose?.({ value: 42 });

// Parent
<Child onclose={handleClose} />;
```

### 9. **Two-way Binding** - Add `$bindable()` to props

```javascript
// Svelte 4 - Child
export let value;

// Svelte 4 - Parent
<Child bind:value />;

// Svelte 5 - Child
let { value = $bindable() } = $props();

// Svelte 5 - Parent
<Child bind:value />;
```

### 10. **Slots** - Replace with Snippets

```javascript
// Svelte 4 - Child
<slot />
<slot name="header" />
<slot name="footer">Default footer</slot>

// Svelte 4 - Parent
<Child>
  Default content
  <span slot="header">Header</span>
  <span slot="footer">Footer</span>
</Child>

// Svelte 5 - Child
let { children, header, footer } = $props();
{@render children?.()}
{@render header?.()}
{@render footer?.() ?? 'Default footer'}

// Svelte 5 - Parent
<Child>
  {#snippet children()}Default content{/snippet}
  {#snippet header()}Header{/snippet}
  {#snippet footer()}Footer{/snippet}
</Child>
```

### 11. **Dynamic Components** - Replace `<svelte:component>`

```javascript
// Svelte 4
<svelte:component this={Component} prop={value} />

// Svelte 5
{#if Component}
  <Component prop={value} />
{/if}

// Or with multiple components
{#if type === 'button'}
  <Button {...props} />
{:else if type === 'input'}
  <Input {...props} />
{/if}
```

### 12. **Component Exports** - Use `export` outside of `$props()`

```javascript
// Svelte 4
export let value;
export function focus() {
	// ...
}

// Svelte 5
let { value } = $props();
export function focus() {
	// ...
}
```

### 13. **Context API** - Same but with rune values

```javascript
// Svelte 4
import { setContext, getContext } from 'svelte';
import { writable } from 'svelte/store';

// Parent
const store = writable(0);
setContext('key', store);

// Child
const store = getContext('key');
$store; // auto-subscription

// Svelte 5
import { setContext, getContext } from 'svelte';

// Parent
const state = $state({ count: 0 });
setContext('key', state);

// Child
const state = getContext('key');
state.count; // direct access
```

### 14. **Each Block Keys** - Use proper keyed each blocks

```javascript
// Svelte 4
{#each items as item (item.id)}
  <Item {item} />
{/each}

// Svelte 5 - Same syntax, but ensure proper key usage
{#each items as item (item.id)}
  <Item {item} />
{/each}
```

### 15. **Transitions** - Updates to transition syntax

```javascript
// Svelte 4
import { fade, fly } from 'svelte/transition';
<div transition:fade>
<div in:fly={{ x: 100 }} out:fade>

// Svelte 5 - Same, but with new options
import { fade, fly } from 'svelte/transition';
<div transition:fade>
<div in:fly={{ x: 100 }} out:fade>
```

### 16. **Actions** - Same syntax, different reactivity

```javascript
// Svelte 4 & 5 - Same syntax
<div use:action={params}>

// But update functions work differently
function action(node, params) {
  // Svelte 5: params are now reactive
  $effect(() => {
    // React to params changes
    console.log(params);
  });

  return {
    destroy() {
      // cleanup
    }
  };
}
```

### 17. **Reactive Classes and Styles**

```javascript
// Svelte 4
<div class:active={isActive}>
<div style:color={color}>

// Svelte 5 - Same syntax, but variables must be reactive
let isActive = $state(false);
let color = $state('red');
<div class:active={isActive}>
<div style:color={color}>
```

### 18. **Store Subscriptions** - Manual subscriptions update

```javascript
// Svelte 4
import { onDestroy } from 'svelte';
const unsubscribe = store.subscribe((value) => {
	console.log(value);
});
onDestroy(unsubscribe);

// Svelte 5
$effect(() => {
	const unsubscribe = store.subscribe((value) => {
		console.log(value);
	});
	return unsubscribe; // cleanup
});
```

### 19. **TypeScript Props Interface**

```typescript
// Svelte 4
<script lang="ts">
  export let name: string;
  export let age: number;
  export let optional?: string;
</script>

// Svelte 5
<script lang="ts">
  interface Props {
    name: string;
    age: number;
    optional?: string;
    children?: Snippet;
    header?: Snippet<[string]>; // With parameters
  }

  let { name, age, optional, children, header }: Props = $props();
</script>
```

### 20. **Special Elements Updates**

```javascript
// Svelte 4
<svelte:window on:resize={handleResize} />
<svelte:body on:click={handleClick} />
<svelte:document on:visibilitychange={handleVisibility} />

// Svelte 5
<svelte:window onresize={handleResize} />
<svelte:body onclick={handleClick} />
<svelte:document onvisibilitychange={handleVisibility} />
```

### 21. **Mount Target** - New mount API

```javascript
// Svelte 4
import App from './App.svelte';
const app = new App({
	target: document.body,
	props: { name: 'world' }
});

// Svelte 5
import { mount } from 'svelte';
import App from './App.svelte';
const app = mount(App, {
	target: document.body,
	props: { name: 'world' }
});
```

### 22. **Await Blocks** - Same syntax but with reactive promises

```javascript
// Svelte 5 - Promise must be reactive
let promise = $state(fetchData());

{#await promise}
  Loading...
{:then data}
  {data}
{:catch error}
  {error.message}
{/await}
```

### 23. **Component Bindings** - Update for runes

```javascript
// Binding to component methods
let component = $state();
<Component bind:this={component} />;

// Later
component?.method();
```

### 24. **Immutable Updates** - Simplified with `$state`

```javascript
// Svelte 4 - Required immutable updates
items = [...items, newItem];
obj = { ...obj, key: value };

// Svelte 5 - Can use mutations
let items = $state([]);
items.push(newItem); // Works!

let obj = $state({});
obj.key = value; // Works!
```

### 25. **Module Context** - Updates to `<script context="module">`

```javascript
// Svelte 4
<script context="module">
  export function helper() {}
  let moduleState = 0;
</script>

// Svelte 5 - Use regular module syntax
<script module>
  export function helper() {}
  let moduleState = 0;
</script>
```

## Build Configuration Updates

### Vite Config

```javascript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';

export default {
	plugins: [sveltekit()]
};
```

### Package.json Updates

```json
{
	"devDependencies": {
		"@sveltejs/adapter-auto": "^3.0.0",
		"@sveltejs/kit": "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^4.0.0",
		"svelte": "^5.0.0",
		"vite": "^5.0.0"
	}
}
```

## Common Patterns Migration

### Form Handling

```javascript
// Svelte 5 Pattern
let formData = $state({
	name: '',
	email: ''
});

function handleSubmit(e) {
	e.preventDefault();
	// Process formData
}

<form onsubmit={handleSubmit}>
	<input bind:value={formData.name} />
	<input bind:value={formData.email} />
</form>;
```

### API Calls

```javascript
// Svelte 5 Pattern
let data = $state(null);
let loading = $state(true);
let error = $state(null);

$effect(() => {
	fetchData()
		.then((result) => {
			data = result;
			loading = false;
		})
		.catch((err) => {
			error = err;
			loading = false;
		});
});
```

### Reactive Computations Chain

```javascript
// Svelte 5
let base = $state(10);
let doubled = $derived(base * 2);
let quadrupled = $derived(doubled * 2);
let summary = $derived(`Base: ${base}, Quad: ${quadrupled}`);
```

## Deprecations and Removals

1. **Removed**: `createEventDispatcher`
2. **Removed**: `beforeUpdate`, `afterUpdate`
3. **Removed**: Store auto-subscriptions with `$` prefix in components
4. **Changed**: `<svelte:component>` - use conditional rendering
5. **Changed**: `<slot>` - use Snippets
6. **Changed**: Reactive statements `$:` - use runes

## Testing Updates

```javascript
// Svelte 5 Testing
import { mount, unmount } from 'svelte';
import { test } from 'vitest';
import Component from './Component.svelte';

test('component test', () => {
	const app = mount(Component, {
		target: document.body,
		props: { value: 42 }
	});

	// Test logic

	unmount(app);
});
```

## Performance Considerations

1. **Fine-grained reactivity**: Svelte 5's runes provide more precise control
2. **Smaller bundle sizes**: Runes can lead to smaller compiled output
3. **Better tree-shaking**: Unused rune code is eliminated
4. **Explicit reactivity**: More predictable performance characteristics

## Migration Strategy

1. **Start with leaf components** (components without children)
2. **Update state management** (`$state`, `$derived`)
3. **Convert props** to `$props()`
4. **Replace lifecycle hooks** with `$effect()`
5. **Update event handlers** and remove modifiers
6. **Convert slots** to Snippets
7. **Update parent components** that use the migrated components
8. **Test thoroughly** after each component migration
9. **Update build configuration** last

## Helpful Resources

- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 REPL](https://svelte.dev/repl)
- [Interactive Tutorial](https://learn.svelte.dev)
