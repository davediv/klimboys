import { writable } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message?: string;
	duration?: number;
	action?: {
		label: string;
		handler: () => void;
	};
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	let notificationId = 0;

	function add(notification: Omit<Notification, 'id'>) {
		const id = `notification-${Date.now()}-${notificationId++}`;
		const defaultDuration = 4000; // Default 4 seconds
		const newNotification: Notification = {
			...notification,
			id,
			duration: notification.duration !== undefined ? notification.duration : defaultDuration
		};

		update((notifications) => [...notifications, newNotification]);

		// Auto-remove after duration
		if (newNotification.duration && newNotification.duration > 0) {
			setTimeout(() => {
				remove(id);
			}, newNotification.duration);
		}

		return id;
	}

	function remove(id: string) {
		update((notifications) => notifications.filter((n) => n.id !== id));
	}

	function clear() {
		update(() => []);
	}

	// Helper methods for different notification types
	function success(title: string, message?: string, duration?: number) {
		return add({
			type: 'success',
			title,
			message,
			duration: duration !== undefined ? duration : 4000
		});
	}

	function error(title: string, message?: string, duration?: number) {
		return add({
			type: 'error',
			title,
			message,
			duration: duration !== undefined ? duration : 6000
		}); // Errors stay longer
	}

	function info(title: string, message?: string, duration?: number) {
		return add({
			type: 'info',
			title,
			message,
			duration: duration !== undefined ? duration : 4000
		});
	}

	function warning(title: string, message?: string, duration?: number) {
		return add({
			type: 'warning',
			title,
			message,
			duration: duration !== undefined ? duration : 5000
		});
	}

	return {
		subscribe,
		add,
		remove,
		clear,
		success,
		error,
		info,
		warning
	};
}

export const notifications = createNotificationStore();
