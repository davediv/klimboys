import { APP_CURRENCY, APP_LANGUAGE_TAG, APP_TIME_ZONE, publicMessages } from '../business.js';

/**
 * @typedef {import('../business.js').OrderingChannelId} OrderingChannelId
 * @typedef {import('../business.js').SocialChannelId} SocialChannelId
 * @typedef {import('../business.js').PublicBusinessConfig} PublicBusinessConfig
 *
 * @typedef {Object} DestinationDefinition
 * @property {OrderingChannelId | SocialChannelId | 'maps'} id
 * @property {string} envKey
 * @property {string} label
 * @property {string} description
 * @property {string[]} allowedHosts
 */

/** @type {DestinationDefinition[]} */
const orderingDefinitions = [
	{
		id: 'whatsapp',
		envKey: 'PUBLIC_WHATSAPP_NUMBER',
		label: 'WhatsApp',
		description: 'Send your selected shake directly to Klimboys.',
		allowedHosts: []
	},
	{
		id: 'gofood',
		envKey: 'PUBLIC_GOFOOD_URL',
		label: 'GoFood',
		description: 'Continue to the verified Klimboys listing on GoFood.',
		allowedHosts: ['gofood.co.id', 'gofood.link', 'gojek.com']
	},
	{
		id: 'grabfood',
		envKey: 'PUBLIC_GRABFOOD_URL',
		label: 'GrabFood',
		description: 'Continue to the verified Klimboys listing on GrabFood.',
		allowedHosts: ['grab.com']
	},
	{
		id: 'shopeefood',
		envKey: 'PUBLIC_SHOPEEFOOD_URL',
		label: 'ShopeeFood',
		description: 'Continue to the verified Klimboys listing on ShopeeFood.',
		allowedHosts: ['shopee.co.id', 'shopeefood.co.id']
	}
];

/** @type {DestinationDefinition[]} */
const socialDefinitions = [
	{
		id: 'instagram',
		envKey: 'PUBLIC_INSTAGRAM_URL',
		label: 'Instagram',
		description: 'Klimboys on Instagram',
		allowedHosts: ['instagram.com']
	},
	{
		id: 'facebook',
		envKey: 'PUBLIC_FACEBOOK_URL',
		label: 'Facebook',
		description: 'Klimboys on Facebook',
		allowedHosts: ['facebook.com', 'fb.com']
	},
	{
		id: 'x',
		envKey: 'PUBLIC_X_URL',
		label: 'X',
		description: 'Klimboys on X',
		allowedHosts: ['x.com', 'twitter.com']
	}
];

/** @type {DestinationDefinition} */
const mapsDefinition = {
	id: 'maps',
	envKey: 'PUBLIC_MAPS_URL',
	label: 'Map',
	description: 'Klimboys location',
	allowedHosts: ['google.com', 'maps.app.goo.gl']
};

const knownPlaceholderValues = new Set(
	[
		'6282112345678',
		'+62 21 1234 5678',
		'hello@klimboys.com',
		'https://gofood.link/a/DxHrnHF',
		'https://food.grab.com/id/en/restaurant/klimboys-delivery',
		'https://shopee.co.id/universal-link/now-food/shop/klimboys',
		'https://instagram.com/klimboys',
		'https://facebook.com/klimboys',
		'https://twitter.com/klimboys'
	].map(normalizeForComparison)
);
const knownPlaceholderPhoneDigits = new Set(['6282112345678', '622112345678']);

export const PUBLIC_CONFIG_KEYS = Object.freeze([
	'PUBLIC_BUSINESS_ADDRESS',
	'PUBLIC_BUSINESS_PHONE',
	'PUBLIC_BUSINESS_EMAIL',
	'PUBLIC_OPENING_HOURS',
	'PUBLIC_MAPS_URL',
	...orderingDefinitions.map((definition) => definition.envKey),
	...socialDefinitions.map((definition) => definition.envKey)
]);

/** @param {unknown} value */
function configuredString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

/** @param {string} value */
function normalizeForComparison(value) {
	return value.trim().toLowerCase().replace(/\/+$/, '');
}

/** @param {string} value */
function isPlaceholder(value) {
	const normalized = normalizeForComparison(value);
	return (
		knownPlaceholderValues.has(normalized) ||
		/(^|[\s._/-])(example|placeholder|replace[-_ ]?me|your[-_ ])/i.test(normalized) ||
		/x{5,}/i.test(normalized)
	);
}

/** @param {string} hostname @param {string[]} allowedHosts */
function hostIsAllowed(hostname, allowedHosts) {
	const normalizedHost = hostname.toLowerCase().replace(/^www\./, '');
	return allowedHosts.some(
		(allowedHost) => normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`)
	);
}

/** @param {string} value @param {string[]} allowedHosts */
function validatedHttpsUrl(value, allowedHosts) {
	if (!value || isPlaceholder(value)) return null;
	try {
		const candidate = new URL(value);
		if (
			candidate.protocol !== 'https:' ||
			candidate.username ||
			candidate.password ||
			!hostIsAllowed(candidate.hostname, allowedHosts)
		) {
			return null;
		}
		return candidate.toString();
	} catch {
		return null;
	}
}

/** @param {string} value */
function validatedPhone(value) {
	if (!value || isPlaceholder(value)) return null;
	const digits = value.replace(/\D/g, '');
	if (
		digits.length < 8 ||
		digits.length > 15 ||
		/^(\d)\1+$/.test(digits) ||
		knownPlaceholderPhoneDigits.has(digits)
	) {
		return null;
	}
	return {
		display: value,
		digits,
		international: value.startsWith('+') || digits.startsWith('62')
	};
}

/** @param {string} value */
function validatedEmail(value) {
	if (!value || isPlaceholder(value)) return null;
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
	const domain = value.slice(value.lastIndexOf('@') + 1).toLowerCase();
	return /\.(?:example|invalid|localhost|test)$/.test(domain) ? null : value;
}

/** @param {Record<string, unknown>} environment @param {DestinationDefinition} definition */
function destinationFor(environment, definition) {
	const value = configuredString(environment[definition.envKey]);
	if (!value) return null;
	if (definition.id === 'whatsapp') {
		const phone = validatedPhone(value);
		return phone && !phone.digits.startsWith('0') ? phone.digits : null;
	}
	return validatedHttpsUrl(value, definition.allowedHosts);
}

/** @param {Record<string, unknown>} environment @param {DestinationDefinition[]} definitions */
function publicLinks(environment, definitions) {
	return definitions.flatMap((definition) =>
		destinationFor(environment, definition)
			? [
					{
						id: definition.id,
						label: definition.label,
						href: `/go/${definition.id}`,
						description: definition.description
					}
				]
			: []
	);
}

/** @param {Record<string, unknown> | undefined} environment */
export function createPublicBusinessConfig(environment = {}) {
	const addressValue = configuredString(environment.PUBLIC_BUSINESS_ADDRESS);
	const address = addressValue && !isPlaceholder(addressValue) ? addressValue : null;
	const phone = validatedPhone(configuredString(environment.PUBLIC_BUSINESS_PHONE));
	const email = validatedEmail(configuredString(environment.PUBLIC_BUSINESS_EMAIL));
	const openingHoursValue = configuredString(environment.PUBLIC_OPENING_HOURS);
	const openingHours =
		openingHoursValue && !isPlaceholder(openingHoursValue)
			? openingHoursValue
					.split('|')
					.map((entry) => entry.trim())
					.filter(Boolean)
			: [];
	const mapsDestination = validatedHttpsUrl(
		configuredString(environment.PUBLIC_MAPS_URL),
		mapsDefinition.allowedHosts
	);

	/** @type {PublicBusinessConfig} */
	const config = {
		name: 'Klimboys',
		summary: publicMessages.brandSummary,
		locale: {
			languageTag: APP_LANGUAGE_TAG,
			timeZone: APP_TIME_ZONE,
			currency: APP_CURRENCY
		},
		contact: {
			address,
			mapsHref: mapsDestination ? '/go/maps' : null,
			phone: phone?.display ?? null,
			phoneHref: phone ? `tel:${phone.international ? '+' : ''}${phone.digits}` : null,
			email,
			openingHours,
			hasDetails: Boolean(address || phone || email || openingHours.length > 0)
		},
		orderingChannels: publicLinks(environment, orderingDefinitions),
		socialLinks: publicLinks(environment, socialDefinitions)
	};

	return config;
}

/**
 * Resolve a configured server-side destination without exposing the outbound
 * URL to public page data.
 *
 * @param {Record<string, unknown> | undefined} environment
 * @param {string} channelId
 * @param {{ product?: string | null, size?: string | null }} [selection]
 */
export function resolvePublicDestination(environment = {}, channelId, selection = {}) {
	const definition = [...orderingDefinitions, ...socialDefinitions, mapsDefinition].find(
		(candidate) => candidate.id === channelId
	);
	if (!definition) return null;

	const destination = destinationFor(environment, definition);
	if (!destination) return null;
	if (definition.id !== 'whatsapp') return destination;

	const product = configuredString(selection.product).replace(/\s+/g, ' ').slice(0, 100);
	const size = configuredString(selection.size).replace(/\s+/g, ' ').slice(0, 20);
	const chosenItem = product ? `${product}${size ? ` in size ${size}` : ''}` : 'a milkshake';
	const whatsappUrl = new URL(`https://wa.me/${destination}`);
	whatsappUrl.searchParams.set('text', `Hi Klimboys! I'd like to order ${chosenItem}.`);
	return whatsappUrl.toString();
}

/** @param {Record<string, unknown> | undefined} environment */
export function validatePublicEnvironment(environment = {}) {
	/** @type {string[]} */
	const issues = [];
	const definitions = [...orderingDefinitions, ...socialDefinitions, mapsDefinition];

	for (const definition of definitions) {
		const value = configuredString(environment[definition.envKey]);
		if (!value) continue;
		if (isPlaceholder(value)) {
			issues.push(`${definition.envKey} contains a known placeholder.`);
			continue;
		}
		if (!destinationFor(environment, definition)) {
			issues.push(
				definition.id === 'whatsapp'
					? `${definition.envKey} is not a valid international WhatsApp number.`
					: `${definition.envKey} is not a valid approved HTTPS destination.`
			);
		}
	}

	const phoneValue = configuredString(environment.PUBLIC_BUSINESS_PHONE);
	if (phoneValue && !validatedPhone(phoneValue)) {
		issues.push('PUBLIC_BUSINESS_PHONE is invalid or contains a known placeholder.');
	}
	const emailValue = configuredString(environment.PUBLIC_BUSINESS_EMAIL);
	if (emailValue && !validatedEmail(emailValue)) {
		issues.push('PUBLIC_BUSINESS_EMAIL is invalid or contains a known placeholder.');
	}
	for (const key of ['PUBLIC_BUSINESS_ADDRESS', 'PUBLIC_OPENING_HOURS']) {
		const value = configuredString(environment[key]);
		if (value && isPlaceholder(value)) issues.push(`${key} contains a known placeholder.`);
	}

	return issues;
}
