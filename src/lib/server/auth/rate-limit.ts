import { error } from '@sveltejs/kit';

// In-memory rate limiter store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	keyGenerator?: (request: Request) => string; // Custom key generator
	skipSuccessfulRequests?: boolean; // Don't count successful requests
	message?: string; // Custom error message
}

// Default configurations for different endpoints
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
	login: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5,
		message: 'Too many login attempts. Please try again later.'
	},
	register: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 3,
		message: 'Too many registration attempts. Please try again later.'
	},
	api: {
		windowMs: 1 * 60 * 1000, // 1 minute
		maxRequests: 60,
		message: 'Rate limit exceeded. Please slow down.'
	},
	upload: {
		windowMs: 5 * 60 * 1000, // 5 minutes
		maxRequests: 10,
		message: 'Upload rate limit exceeded. Please wait before uploading more files.'
	}
};

// Main rate limiting function
export async function checkRateLimit(
	request: Request,
	config: RateLimitConfig | string
): Promise<void> {
	// Get config
	const limitConfig = typeof config === 'string' ? rateLimitConfigs[config] : config;
	if (!limitConfig) {
		throw new Error(`Rate limit config not found: ${config}`);
	}

	// Generate key
	const key = limitConfig.keyGenerator
		? limitConfig.keyGenerator(request)
		: getDefaultKey(request);

	// Get current state
	const now = Date.now();
	const state = rateLimitStore.get(key);

	// Clean up expired entries periodically
	if (Math.random() < 0.01) {
		cleanupExpiredEntries();
	}

	// Check if window has expired
	if (!state || state.resetAt <= now) {
		rateLimitStore.set(key, {
			count: 1,
			resetAt: now + limitConfig.windowMs
		});
		return;
	}

	// Increment counter
	state.count++;

	// Check if limit exceeded
	if (state.count > limitConfig.maxRequests) {
		const retryAfter = Math.ceil((state.resetAt - now) / 1000);
		throw error(429, {
			message: limitConfig.message || 'Rate limit exceeded',
			retryAfter
		});
	}
}

// Get default key based on IP address
function getDefaultKey(request: Request): string {
	// Try to get real IP from headers (considering proxies)
	const forwarded = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const cfConnectingIp = request.headers.get('cf-connecting-ip');
	
	const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
	const endpoint = new URL(request.url).pathname;
	
	return `${ip}:${endpoint}`;
}

// Clean up expired entries
function cleanupExpiredEntries(): void {
	const now = Date.now();
	for (const [key, state] of rateLimitStore.entries()) {
		if (state.resetAt <= now) {
			rateLimitStore.delete(key);
		}
	}
}

// Reset rate limit for a specific key
export function resetRateLimit(key: string): void {
	rateLimitStore.delete(key);
}

// Get remaining requests for a key
export function getRateLimitStatus(
	request: Request,
	config: RateLimitConfig | string
): { remaining: number; resetAt: number } | null {
	const limitConfig = typeof config === 'string' ? rateLimitConfigs[config] : config;
	if (!limitConfig) return null;

	const key = limitConfig.keyGenerator
		? limitConfig.keyGenerator(request)
		: getDefaultKey(request);

	const state = rateLimitStore.get(key);
	if (!state) {
		return {
			remaining: limitConfig.maxRequests,
			resetAt: Date.now() + limitConfig.windowMs
		};
	}

	return {
		remaining: Math.max(0, limitConfig.maxRequests - state.count),
		resetAt: state.resetAt
	};
}

// Middleware to add rate limit headers
export function addRateLimitHeaders(
	response: Response,
	status: { remaining: number; resetAt: number } | null
): Response {
	if (!status) return response;

	const headers = new Headers(response.headers);
	headers.set('X-RateLimit-Remaining', status.remaining.toString());
	headers.set('X-RateLimit-Reset', Math.ceil(status.resetAt / 1000).toString());

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}