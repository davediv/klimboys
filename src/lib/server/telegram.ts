import { env } from '$env/dynamic/private';

interface TelegramMessage {
	playerName: string;
	prizeName: string;
	voucherCode: string;
	claimedAt: Date;
}

interface TelegramNotificationOptions {
	text: string;
	parseMode?: 'Markdown' | 'HTML' | 'MarkdownV2';
	disableNotification?: boolean;
}

export async function sendTelegramNotification(message: TelegramMessage) {
	// Get environment variables
	const botToken = env.SECRET_TELEGRAM_BOT_TOKEN;
	const chatId = env.SECRET_TELEGRAM_CHAT_ID;
	const messageThreadId = env.SECRET_TELEGRAM_MESSAGE_THREAD_ID;

	console.log('Telegram notification attempt:', {
		hasToken: !!botToken,
		hasChatId: !!chatId,
		hasThreadId: !!messageThreadId,
		message
	});

	// Check if all required env vars are present
	if (!botToken || !chatId) {
		console.warn('Telegram notification skipped: Missing bot token or chat ID');
		return { success: false, error: 'Missing configuration' };
	}

	// Format the message
	const text = `${escapeMarkdown('Hello World')}`;

	// Send the message
	return sendTelegramMessage({
		text,
		parseMode: 'Markdown',
		disableNotification: false
	});
}

export async function sendTelegramMessage(options: TelegramNotificationOptions) {
	const botToken = env.SECRET_TELEGRAM_BOT_TOKEN;
	const chatId = env.SECRET_TELEGRAM_CHAT_ID;
	const messageThreadId = env.SECRET_TELEGRAM_MESSAGE_THREAD_ID;

	if (!botToken || !chatId) {
		console.warn('Telegram notification skipped: Missing bot token or chat ID');
		return { success: false, error: 'Missing configuration' };
	}

	// Prepare the API request
	const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
	const body: any = {
		chat_id: chatId,
		text: options.text,
		parse_mode: options.parseMode || 'Markdown',
		disable_notification: options.disableNotification || false
	};

	// Add message thread ID if provided (for forum/topic support)
	if (messageThreadId) {
		body.message_thread_id = messageThreadId;
	}

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		const data = (await response.json()) as any;

		if (!response.ok) {
			console.error('Telegram API error:', data);
			return { success: false, error: data.description || 'Failed to send message' };
		}

		console.log('Telegram notification sent successfully:', data.result.message_id);
		return { success: true, messageId: data.result.message_id };
	} catch (error) {
		console.error('Failed to send Telegram notification:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

// Helper function to escape special characters in Markdown
function escapeMarkdown(text: string | undefined | null): string {
	if (!text) return 'Unknown';
	return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// Additional helper functions for common notification types
export const telegramNotify = {
	// Prize claimed notification
	prizeClaimed: (message: TelegramMessage) => sendTelegramNotification(message),

	// Generic success notification
	success: async (title: string, message: string) => {
		const text = `✅ *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`;
		return sendTelegramMessage({ text });
	},

	// Error/alert notification
	alert: async (title: string, message: string) => {
		const text = `⚠️ *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`;
		return sendTelegramMessage({ text, disableNotification: false });
	},

	// Info notification
	info: async (title: string, message: string) => {
		const text = `ℹ️ *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`;
		return sendTelegramMessage({ text, disableNotification: true });
	},

	// Daily report
	dailyReport: async (stats: { totalUsers: number; totalRevenue: number; newSignups: number }) => {
		const text = `📊 *Daily Report*
		
👥 Total Users: ${stats.totalUsers}
💰 Total Revenue: $${stats.totalRevenue.toLocaleString()}
📈 New Signups: ${stats.newSignups}

Generated at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`;
		return sendTelegramMessage({ text });
	}
};
