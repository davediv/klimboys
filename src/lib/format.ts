import { APP_CURRENCY, APP_LANGUAGE_TAG } from '$lib/business';

const idrCurrencyFormatter = new Intl.NumberFormat(APP_LANGUAGE_TAG, {
	style: 'currency',
	currency: APP_CURRENCY,
	minimumFractionDigits: 0
});

export function formatIdr(amount: number): string {
	return idrCurrencyFormatter.format(amount);
}
