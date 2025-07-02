#### **Migration Checklist**

When migrating from Svelte 4 to Svelte 5:

1. **Props**: Replace all `export let` with `$props()`
2. **State**: Convert all reactive variables to `$state()`
3. **Stores**: Replace component-local `writable()` with `$state()`
4. **Derived**: Replace `$:` with `$derived()` or `$effect()`
5. **Effects**: Replace lifecycle hooks with `$effect()`
6. **Events**: Change `on:event` to `onevent`
7. **Event Modifiers**: Remove `|preventDefault` and handle in function
8. **Dispatchers**: Replace with callback props
9. **Bindings**: Add `$bindable()` to props that need two-way binding
10. **TypeScript**: Add proper interfaces for all props
11. **Children**: Use `Snippet` type instead of slots
12. **Imports**: Remove unused Svelte 4 imports
13. **Remove store method calls (`.set()`, `.update()`) and use direct assignment**
14. Remove `createEventDispatcher()` and use callback props
15. Replace `onMount`/`onDestroy` with `$effect()`
16. Update component imports to remove unused Svelte 4 functions
17. **Replace `<svelte:component>` with conditional rendering using `{#if}` blocks**
18. Don't Use legacy `<slot>`, use `{@render children()}`
