import { notifications } from '$lib/stores/notifications';

/**
 * Helper functions for common notification patterns
 */

export const notify = {
	// CRUD Operations
	created: (entity: string, name?: string) => {
		const message = name
			? `${entity} "${name}" has been created successfully`
			: `${entity} has been created successfully`;
		notifications.success(`${entity} Created`, message);
	},

	updated: (entity: string, name?: string) => {
		const message = name
			? `${entity} "${name}" has been updated successfully`
			: `${entity} has been updated successfully`;
		notifications.success(`${entity} Updated`, message);
	},

	deleted: (entity: string, name?: string) => {
		const message = name
			? `${entity} "${name}" has been deleted successfully`
			: `${entity} has been deleted successfully`;
		notifications.success(`${entity} Deleted`, message);
	},

	// Error handling
	error: (action: string, error?: string) => {
		notifications.error(
			`${action} Failed`,
			error || `An unexpected error occurred while ${action.toLowerCase()}`
		);
	},

	// File operations
	exported: (entity: string, format: string = 'CSV') => {
		notifications.success('Export Successful', `${entity} have been exported to ${format}`);
	},

	imported: (entity: string, count?: number) => {
		const message = count
			? `${count} ${entity} have been imported successfully`
			: `${entity} have been imported successfully`;
		notifications.success('Import Successful', message);
	},

	// Form validation
	validationError: (message: string) => {
		notifications.warning('Validation Error', message);
	},

	// Generic actions
	action: (title: string, message: string, type: 'success' | 'info' = 'success') => {
		if (type === 'success') {
			notifications.success(title, message);
		} else {
			notifications.info(title, message);
		}
	}
};
