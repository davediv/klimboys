/**
 * @typedef {'whatsapp' | 'gofood' | 'grabfood' | 'shopeefood'} OrderingChannelId
 * @typedef {'instagram' | 'facebook' | 'x'} SocialChannelId
 *
 * @typedef {Object} PublicLink
 * @property {string} id
 * @property {string} label
 * @property {string} href
 * @property {string} description
 *
 * @typedef {Object} PublicContact
 * @property {string | null} address
 * @property {string | null} mapsHref
 * @property {string | null} phone
 * @property {string | null} phoneHref
 * @property {string | null} email
 * @property {string[]} openingHours
 * @property {boolean} hasDetails
 *
 * @typedef {Object} PublicBusinessConfig
 * @property {string} name
 * @property {string} summary
 * @property {{ languageTag: string, timeZone: string, currency: string }} locale
 * @property {PublicContact} contact
 * @property {PublicLink[]} orderingChannels
 * @property {PublicLink[]} socialLinks
 */

export const APP_LANGUAGE_TAG = 'en-ID';
export const APP_TIME_ZONE = 'Asia/Jakarta';
export const APP_CURRENCY = 'IDR';

export const publicMessages = Object.freeze({
	brandSummary:
		'Milkshakes made to order. Browse the current menu, choose a size, and continue through an available ordering channel.',
	orderingUnavailable:
		'Online ordering destinations are being verified. You can still browse the current menu.',
	contactUnavailable: 'Store contact details are being verified and are not published yet.'
});
