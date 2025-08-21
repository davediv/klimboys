/**
 * Utility functions for handling dates in Jakarta timezone
 */

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

// Indonesian day names
const INDONESIAN_DAYS = [
	'Minggu', // Sunday
	'Senin', // Monday
	'Selasa', // Tuesday
	'Rabu', // Wednesday
	'Kamis', // Thursday
	'Jumat', // Friday
	'Sabtu' // Saturday
];

// Indonesian month names (abbreviated)
const INDONESIAN_MONTHS_SHORT = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'Mei',
	'Jun',
	'Jul',
	'Agu',
	'Sep',
	'Okt',
	'Nov',
	'Des'
];

/**
 * Convert any date to Jakarta timezone
 */
export function toJakartaTime(date?: Date | string | number): Date {
	const inputDate = date ? new Date(date) : new Date();
	return new Date(inputDate.toLocaleString('en-US', { timeZone: JAKARTA_TIMEZONE }));
}

/**
 * Format date with full day, date and time
 * Example: "Rabu, 25 Jun 2025, 10:30 PM"
 */
export function formatFullDateTime(date?: Date | string | number): string {
	const jakartaDate = date ? new Date(date) : new Date();

	// Get Jakarta time components
	const options: Intl.DateTimeFormatOptions = {
		timeZone: JAKARTA_TIMEZONE,
		weekday: 'long',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	};

	const formatter = new Intl.DateTimeFormat('en-US', options);
	const parts = formatter.formatToParts(jakartaDate);

	// Extract parts
	const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
	const day = parts.find((p) => p.type === 'day')?.value || '';
	const month = parts.find((p) => p.type === 'month')?.value || '';
	const year = parts.find((p) => p.type === 'year')?.value || '';
	const hour = parts.find((p) => p.type === 'hour')?.value || '';
	const minute = parts.find((p) => p.type === 'minute')?.value || '';
	const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';

	// Get Indonesian day name
	const dayIndex = jakartaDate.getDay();
	const indonesianDay = INDONESIAN_DAYS[dayIndex];

	// Get Indonesian month name
	const monthIndex = jakartaDate.getMonth();
	const indonesianMonth = INDONESIAN_MONTHS_SHORT[monthIndex];

	return `${indonesianDay}, ${day} ${indonesianMonth} ${year}, ${hour}:${minute} ${dayPeriod}`;
}

/**
 * Format date with day and date only
 * Example: "Rabu, 25 Jun 2025"
 */
export function formatDayDate(date?: Date | string | number): string {
	const jakartaDate = date ? new Date(date) : new Date();

	const options: Intl.DateTimeFormatOptions = {
		timeZone: JAKARTA_TIMEZONE,
		weekday: 'long',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	};

	const formatter = new Intl.DateTimeFormat('en-US', options);
	const parts = formatter.formatToParts(jakartaDate);

	const day = parts.find((p) => p.type === 'day')?.value || '';
	const year = parts.find((p) => p.type === 'year')?.value || '';

	// Get Indonesian day and month names
	const dayIndex = jakartaDate.getDay();
	const indonesianDay = INDONESIAN_DAYS[dayIndex];

	const monthIndex = jakartaDate.getMonth();
	const indonesianMonth = INDONESIAN_MONTHS_SHORT[monthIndex];

	return `${indonesianDay}, ${day} ${indonesianMonth} ${year}`;
}

/**
 * Format date with date and time only
 * Example: "25 Jun 2025, 10:30 PM"
 */
export function formatDateTime(date?: Date | string | number): string {
	const jakartaDate = date ? new Date(date) : new Date();

	const options: Intl.DateTimeFormatOptions = {
		timeZone: JAKARTA_TIMEZONE,
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	};

	const formatter = new Intl.DateTimeFormat('en-US', options);
	const parts = formatter.formatToParts(jakartaDate);

	const day = parts.find((p) => p.type === 'day')?.value || '';
	const year = parts.find((p) => p.type === 'year')?.value || '';
	const hour = parts.find((p) => p.type === 'hour')?.value || '';
	const minute = parts.find((p) => p.type === 'minute')?.value || '';
	const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';

	// Get Indonesian month name
	const monthIndex = jakartaDate.getMonth();
	const indonesianMonth = INDONESIAN_MONTHS_SHORT[monthIndex];

	return `${day} ${indonesianMonth} ${year}, ${hour}:${minute} ${dayPeriod}`;
}

/**
 * Format time only
 * Example: "10:30 PM"
 */
export function formatTime(date?: Date | string | number): string {
	const jakartaDate = date ? new Date(date) : new Date();

	return jakartaDate.toLocaleTimeString('en-US', {
		timeZone: JAKARTA_TIMEZONE,
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}

/**
 * Get current Jakarta time
 */
export function getCurrentJakartaTime(): Date {
	return toJakartaTime(new Date());
}

/**
 * Check if a date is today in Jakarta timezone
 */
export function isToday(date: Date | string | number): boolean {
	const jakartaDate = toJakartaTime(date);
	const today = getCurrentJakartaTime();

	return (
		jakartaDate.getDate() === today.getDate() &&
		jakartaDate.getMonth() === today.getMonth() &&
		jakartaDate.getFullYear() === today.getFullYear()
	);
}

/**
 * Check if a date is tomorrow in Jakarta timezone
 */
export function isTomorrow(date: Date | string | number): boolean {
	const jakartaDate = toJakartaTime(date);
	const tomorrow = getCurrentJakartaTime();
	tomorrow.setDate(tomorrow.getDate() + 1);

	return (
		jakartaDate.getDate() === tomorrow.getDate() &&
		jakartaDate.getMonth() === tomorrow.getMonth() &&
		jakartaDate.getFullYear() === tomorrow.getFullYear()
	);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string | number): string {
	const jakartaDate = toJakartaTime(date);
	const now = getCurrentJakartaTime();
	const diffMs =
		(jakartaDate instanceof Date ? jakartaDate : new Date(jakartaDate)).getTime() - now.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (Math.abs(diffSecs) < 60) {
		return 'just now';
	} else if (Math.abs(diffMins) < 60) {
		const mins = Math.abs(diffMins);
		return diffMs < 0
			? `${mins} minute${mins > 1 ? 's' : ''} ago`
			: `in ${mins} minute${mins > 1 ? 's' : ''}`;
	} else if (Math.abs(diffHours) < 24) {
		const hours = Math.abs(diffHours);
		return diffMs < 0
			? `${hours} hour${hours > 1 ? 's' : ''} ago`
			: `in ${hours} hour${hours > 1 ? 's' : ''}`;
	} else if (Math.abs(diffDays) < 30) {
		const days = Math.abs(diffDays);
		return diffMs < 0
			? `${days} day${days > 1 ? 's' : ''} ago`
			: `in ${days} day${days > 1 ? 's' : ''}`;
	} else {
		// For dates more than 30 days, show the actual date
		return formatDayDate(jakartaDate);
	}
}

/**
 * Format month and year only
 * Example: "Jun 2025"
 */
export function formatMonthYear(date?: Date | string | number): string {
	const jakartaDate = date ? new Date(date) : new Date();

	const options: Intl.DateTimeFormatOptions = {
		timeZone: JAKARTA_TIMEZONE,
		month: 'short',
		year: 'numeric'
	};

	const formatter = new Intl.DateTimeFormat('en-US', options);
	const parts = formatter.formatToParts(jakartaDate);

	const year = parts.find((p) => p.type === 'year')?.value || '';

	// Get Indonesian month name
	const monthIndex = jakartaDate.getMonth();
	const indonesianMonth = INDONESIAN_MONTHS_SHORT[monthIndex];

	return `${indonesianMonth} ${year}`;
}

/**
 * Utility object for easy access to all formatters
 */
export const jakartaTime = {
	// Converters
	toJakarta: toJakartaTime,
	current: getCurrentJakartaTime,

	// Formatters
	full: formatFullDateTime, // "Rabu, 25 Jun 2025, 10:30 PM"
	dayDate: formatDayDate, // "Rabu, 25 Jun 2025"
	dateTime: formatDateTime, // "25 Jun 2025, 10:30 PM"
	time: formatTime, // "10:30 PM"
	relative: formatRelativeTime, // "2 hours ago"
	monthYear: formatMonthYear, // "Jun 2025"

	// Checkers
	isToday,
	isTomorrow,

	// Constants
	timezone: JAKARTA_TIMEZONE,
	days: INDONESIAN_DAYS,
	months: INDONESIAN_MONTHS_SHORT
};
