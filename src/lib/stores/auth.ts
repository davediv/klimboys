import { writable } from 'svelte/store';

export const userStore = writable<{
	id: string;
	email: string;
	name?: string;
	role: 'admin' | 'cashier' | 'viewer';
} | null>(null);
