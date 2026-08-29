const idrCurrencyFormatter = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0
});

export function formatIdr(amount: number): string {
	return idrCurrencyFormatter.format(amount);
}
