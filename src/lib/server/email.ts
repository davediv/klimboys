interface AuthEmailMessage {
	to: string;
	subject: string;
	heading: string;
	message: string;
	actionLabel: string;
	actionUrl: string;
}

interface EmailSendingBinding {
	send(message: {
		to: string;
		from: { email: string; name: string };
		subject: string;
		text: string;
		html: string;
	}): Promise<void>;
}

let emailBinding: EmailSendingBinding | null = null;
let senderAddress: string | null = null;

function isValidSender(value: string | undefined): value is string {
	return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export function initializeEmailService(binding: unknown, from: string | undefined) {
	emailBinding =
		typeof binding === 'object' &&
		binding !== null &&
		'send' in binding &&
		typeof binding.send === 'function'
			? (binding as EmailSendingBinding)
			: null;
	senderAddress = isValidSender(from) ? from : null;
}

export function isEmailServiceConfigured(): boolean {
	return emailBinding !== null && senderAddress !== null;
}

export async function sendAuthEmail(message: AuthEmailMessage): Promise<void> {
	if (!emailBinding || !senderAddress) {
		throw new Error('Authentication email service is not configured.');
	}

	const actionUrl = new URL(message.actionUrl);
	if (actionUrl.protocol !== 'https:' && actionUrl.hostname !== 'localhost') {
		throw new Error('Authentication email action URL must use HTTPS.');
	}

	const safeHeading = escapeHtml(message.heading);
	const safeMessage = escapeHtml(message.message);
	const safeActionLabel = escapeHtml(message.actionLabel);
	const safeActionUrl = escapeHtml(actionUrl.toString());

	await emailBinding.send({
		to: message.to,
		from: { email: senderAddress, name: 'Klimboys' },
		subject: message.subject,
		text: `${message.heading}\n\n${message.message}\n\n${message.actionLabel}: ${actionUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
		html: `
			<!doctype html>
			<html lang="en">
				<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827">
					<div style="max-width:560px;margin:0 auto;padding:40px 20px">
						<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
							<p style="margin:0 0 8px;color:#ff6b6b;font-weight:700">Klimboys staff workspace</p>
							<h1 style="margin:0 0 16px;font-size:24px">${safeHeading}</h1>
							<p style="margin:0 0 24px;line-height:1.6;color:#4b5563">${safeMessage}</p>
							<a href="${safeActionUrl}" style="display:inline-block;border-radius:8px;background:#ff6b6b;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:700">${safeActionLabel}</a>
							<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280">If you did not request this, you can ignore this email.</p>
						</div>
					</div>
				</body>
			</html>
		`
	});
}
