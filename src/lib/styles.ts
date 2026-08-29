type ControlSize = 'xs' | 'sm' | 'md' | 'lg';
type Tone = 'default' | 'brand' | 'neutral' | 'positive' | 'caution' | 'danger';
type ButtonVariant = 'solid' | 'ghost' | 'outline';

export function cx(...classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(' ');
}

const buttonBase =
	'inline-flex shrink-0 cursor-pointer touch-manipulation select-none flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap rounded border text-center align-middle font-semibold shadow-sm transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:isolate focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-[0.5px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-ink/10 disabled:text-ink/20 disabled:shadow-none';

const buttonSizes: Record<ControlSize, string> = {
	xs: 'h-6 px-2 text-[0.6875rem]',
	sm: 'h-8 px-3 text-xs',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-5 text-lg'
};

const solidButtons: Record<Tone, string> = {
	default:
		'border-control-border bg-surface-muted text-ink outline-ink hover:bg-control-hover active:bg-control-active',
	brand:
		'border-brand-border bg-brand text-brand-foreground outline-brand hover:bg-brand-hover active:bg-brand-active',
	neutral:
		'border-neutral-border bg-neutral text-neutral-foreground outline-neutral hover:bg-neutral-hover active:bg-neutral-active',
	positive:
		'border-positive-border bg-positive text-positive-foreground outline-positive hover:bg-positive-hover active:bg-positive-active',
	caution:
		'border-caution-border bg-caution text-caution-foreground outline-caution hover:bg-caution-hover active:bg-caution-active',
	danger:
		'border-danger-border bg-danger text-danger-foreground outline-danger hover:bg-danger-hover active:bg-danger-active'
};

const outlineButtons: Record<Tone, string> = {
	default:
		'border-ink bg-transparent text-ink shadow-none outline-ink hover:bg-ink hover:text-surface',
	brand:
		'border-brand bg-transparent text-brand shadow-none outline-brand hover:bg-brand hover:text-brand-foreground',
	neutral:
		'border-neutral bg-transparent text-neutral shadow-none outline-neutral hover:bg-neutral hover:text-neutral-foreground',
	positive:
		'border-positive bg-transparent text-positive shadow-none outline-positive hover:bg-positive hover:text-positive-foreground',
	caution:
		'border-caution bg-transparent text-caution shadow-none outline-caution hover:bg-caution hover:text-caution-foreground',
	danger:
		'border-danger bg-transparent text-danger shadow-none outline-danger hover:bg-danger hover:text-danger-foreground'
};

interface ButtonOptions {
	variant?: ButtonVariant;
	tone?: Tone;
	size?: ControlSize;
	shape?: 'default' | 'circle' | 'square';
	block?: boolean;
}

export function buttonStyles({
	variant = 'solid',
	tone = 'default',
	size = 'md',
	shape = 'default',
	block = false
}: ButtonOptions = {}): string {
	const colors =
		variant === 'ghost'
			? 'border-transparent bg-transparent text-current shadow-none outline-current hover:bg-control-hover active:bg-control-active disabled:bg-transparent'
			: variant === 'outline'
				? outlineButtons[tone]
				: solidButtons[tone];
	const shapeClass =
		shape === 'circle'
			? size === 'xs'
				? 'w-6 rounded-full px-0'
				: size === 'sm'
					? 'w-8 rounded-full px-0'
					: size === 'lg'
						? 'w-12 rounded-full px-0'
						: 'w-10 rounded-full px-0'
			: shape === 'square'
				? size === 'xs'
					? 'w-6 px-0'
					: size === 'sm'
						? 'w-8 px-0'
						: size === 'lg'
							? 'w-12 px-0'
							: 'w-10 px-0'
				: '';

	return cx(buttonBase, buttonSizes[size], colors, shapeClass, block && 'w-full');
}

const badgeBase =
	'inline-flex w-fit items-center justify-center gap-2 rounded-lg border align-middle font-normal';

const badgeSizes: Record<ControlSize, string> = {
	xs: 'h-4 px-[calc(0.5rem-1px)] text-[0.625rem]',
	sm: 'h-5 px-[calc(0.625rem-1px)] text-xs',
	md: 'h-6 px-[calc(0.75rem-1px)] text-sm',
	lg: 'h-7 px-[calc(0.875rem-1px)] text-base'
};

const badgeTones: Record<Tone | 'ghost', string> = {
	default: 'border-surface-muted bg-surface text-ink',
	brand: 'border-brand bg-brand text-brand-foreground',
	neutral: 'border-neutral bg-neutral text-neutral-foreground',
	positive: 'border-positive bg-positive text-positive-foreground',
	caution: 'border-caution bg-caution text-caution-foreground',
	danger: 'border-danger bg-danger text-danger-foreground',
	ghost: 'border-surface-muted bg-surface-muted text-ink'
};

export function badgeStyles(tone: Tone | 'ghost' = 'default', size: ControlSize = 'md'): string {
	return cx(badgeBase, badgeSizes[size], badgeTones[tone]);
}

export const cardStyles =
	'relative flex flex-col rounded-lg outline-0 outline-offset-2 transition-[outline] duration-200 focus-visible:outline-2 focus-visible:outline-current';
export const cardBodyStyles = 'flex flex-auto flex-col gap-2 p-6 text-sm [&_p]:grow';
export const cardTitleStyles = 'flex items-center gap-2 text-lg font-semibold';
export const cardActionsStyles = 'flex flex-wrap items-start gap-2';

const fieldBase =
	'inline-flex shrink cursor-text appearance-none items-center rounded border border-ink/20 bg-surface px-3 text-sm text-ink shadow-[inset_0_1px_color-mix(in_oklab,var(--color-ink)_2%,transparent),inset_0_-1px_oklch(100%_0_0/10%)] outline-none focus:z-10 focus:border-ink focus:shadow-none focus:outline-2 focus:outline-ink focus:outline-offset-2 disabled:cursor-not-allowed disabled:border-surface-muted disabled:bg-surface-muted disabled:text-ink/40 disabled:placeholder:text-ink/20';

interface FieldOptions {
	size?: Exclude<ControlSize, 'xs' | 'lg'>;
	full?: boolean;
}

export function inputStyles({ size = 'md', full = false }: FieldOptions = {}): string {
	return cx(
		fieldBase,
		size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
		full ? 'w-full' : 'w-[clamp(3rem,20rem,100%)]'
	);
}

export function selectStyles({ size = 'md', full = false }: FieldOptions = {}): string {
	return cx(
		fieldBase,
		'select-chevron cursor-pointer pr-7',
		size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
		full ? 'w-full' : 'w-[clamp(3rem,20rem,100%)]'
	);
}

export function textareaStyles({ size = 'md', full = false }: FieldOptions = {}): string {
	return cx(
		fieldBase,
		'min-h-20 items-start py-2 whitespace-normal',
		size === 'sm' ? 'text-xs' : 'text-sm',
		full ? 'w-full' : 'w-[clamp(3rem,20rem,100%)]'
	);
}

export const fileInputStyles =
	'file-picker inline-flex h-10 w-[clamp(3rem,20rem,100%)] cursor-pointer appearance-none items-center rounded border border-ink/20 bg-surface pr-3 text-sm leading-8 text-ink shadow-[inset_0_1px_color-mix(in_oklab,var(--color-ink)_2%,transparent),inset_0_-1px_oklch(100%_0_0/10%)] outline-none focus:border-ink focus:outline-2 focus:outline-ink focus:outline-offset-2 disabled:cursor-not-allowed disabled:border-surface-muted disabled:bg-surface-muted disabled:text-ink/20';

export const fieldLabelStyles =
	'inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ink/60';
export const fieldHintStyles =
	'inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink/60';

const alertBase =
	'grid grid-flow-col grid-cols-[auto_minmax(auto,1fr)] place-items-center justify-start gap-4 rounded-lg border px-4 py-3 text-left text-sm leading-5 shadow-sm';
const alertTones: Record<Exclude<Tone, 'default' | 'brand' | 'neutral'>, string> = {
	positive: 'border-positive bg-positive text-positive-foreground',
	caution: 'border-caution bg-caution text-caution-foreground',
	danger: 'border-danger bg-danger text-danger-foreground'
};

export function alertStyles(tone: 'positive' | 'caution' | 'danger'): string {
	return cx(alertBase, alertTones[tone]);
}

export const dividerStyles =
	'my-4 flex h-4 self-stretch whitespace-nowrap before:h-0.5 before:w-full before:grow before:bg-ink/10 after:h-0.5 after:w-full after:grow after:bg-ink/10 not-empty:items-center not-empty:gap-4';

export const modalRootStyles =
	'fixed inset-0 z-[999] grid h-full w-full animate-overlay-enter place-items-center overflow-hidden bg-black/40 overscroll-contain';
export const modalPanelStyles =
	'relative z-10 col-start-1 row-start-1 max-h-screen w-11/12 max-w-lg animate-modal-enter overflow-y-auto overscroll-contain rounded-lg bg-surface p-6 shadow-2xl';
export const modalBackdropStyles =
	'col-start-1 row-start-1 h-full w-full place-self-stretch cursor-default text-transparent';
export const modalActionsStyles = 'mt-6 flex justify-end gap-2';

export function spinnerStyles(size: 'sm' | 'md' | 'lg' = 'md'): string {
	return cx(
		'pointer-events-none inline-block aspect-square bg-current align-middle spinner-mask',
		size === 'sm' ? 'w-5' : size === 'lg' ? 'w-7' : 'w-6'
	);
}

export const tableStyles =
	'relative w-full rounded-lg text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_th]:px-4 [&_th]:py-3 [&_th]:align-middle [&_thead]:whitespace-nowrap [&_thead]:text-sm [&_thead]:font-semibold [&_thead]:text-ink/60 [&_thead_tr]:border-b [&_thead_tr]:border-ink/5 [&_tbody_tr:not(:last-child)]:border-b [&_tbody_tr:not(:last-child)]:border-ink/5';
export const compactTableStyles =
	'relative w-full rounded-lg text-left text-sm [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2 [&_th]:align-middle [&_thead]:whitespace-nowrap [&_thead]:text-sm [&_thead]:font-semibold [&_thead]:text-ink/60 [&_thead_tr]:border-b [&_thead_tr]:border-ink/5 [&_tbody_tr]:text-xs [&_tbody_tr:not(:last-child)]:border-b [&_tbody_tr:not(:last-child)]:border-ink/5';
