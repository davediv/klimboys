import { env } from '$env/dynamic/private';

interface TeamsMessage {
	playerName: string;
	prizeName: string;
	voucherCode: string;
	claimedAt: Date;
}

interface TeamsCard {
	type: 'AdaptiveCard';
	version: string;
	body: any[];
	actions?: any[];
}

interface TeamsNotificationOptions {
	title: string;
	text: string;
	color?: 'default' | 'dark' | 'light' | 'accent' | 'good' | 'warning' | 'attention';
	facts?: Array<{ name: string; value: string }>;
	actions?: Array<{
		type: 'OpenUrl';
		title: string;
		url: string;
	}>;
}

export async function sendTeamsNotification(message: TeamsMessage) {
	// Get environment variables
	const webhookUrl = env.SECRET_TEAMS_WEBHOOK_URL;

	console.log('Teams notification attempt:', {
		hasWebhookUrl: !!webhookUrl,
		message
	});

	// Check if webhook URL is present
	if (!webhookUrl) {
		console.warn('Teams notification skipped: Missing webhook URL');
		return { success: false, error: 'Missing configuration' };
	}

	// Create adaptive card for rich formatting
	const adaptiveCard: TeamsCard = {
		type: 'AdaptiveCard',
		version: '1.4',
		body: [
			{
				type: 'TextBlock',
				text: '🎉 Prize Claimed!',
				weight: 'bolder',
				size: 'large',
				color: 'accent'
			},
			{
				type: 'FactSet',
				facts: [
					{
						title: '👤 Player',
						value: message.playerName
					},
					{
						title: '🎁 Prize',
						value: message.prizeName
					},
					{
						title: '🎟️ Voucher Code',
						value: message.voucherCode
					},
					{
						title: '⏰ Time',
						value: message.claimedAt.toLocaleString('en-US', {
							timeZone: 'Asia/Jakarta',
							dateStyle: 'medium',
							timeStyle: 'short'
						})
					}
				]
			}
		]
	};

	// Send the message
	return sendTeamsMessage({
		type: 'message',
		attachments: [
			{
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: adaptiveCard
			}
		]
	});
}

export async function sendTeamsMessage(payload: any) {
	const webhookUrl = env.SECRET_TEAMS_WEBHOOK_URL;

	if (!webhookUrl) {
		console.warn('Teams notification skipped: Missing webhook URL');
		return { success: false, error: 'Missing configuration' };
	}

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		// Teams webhooks return text response, not JSON
		const responseText = await response.text();

		if (!response.ok) {
			console.error('Teams webhook error:', response.status, responseText);
			return { success: false, error: `Failed to send message: ${response.status}` };
		}

		console.log('Teams notification sent successfully');
		return { success: true, response: responseText };
	} catch (error) {
		console.error('Failed to send Teams notification:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

// Helper function to create simple message card (legacy format, but widely supported)
export async function sendSimpleTeamsMessage(options: TeamsNotificationOptions) {
	const webhookUrl = env.SECRET_TEAMS_WEBHOOK_URL;

	if (!webhookUrl) {
		console.warn('Teams notification skipped: Missing webhook URL');
		return { success: false, error: 'Missing configuration' };
	}

	const payload = {
		'@type': 'MessageCard',
		'@context': 'https://schema.org/extensions',
		themeColor: getThemeColor(options.color || 'default'),
		summary: options.title,
		sections: [
			{
				activityTitle: options.title,
				text: options.text,
				facts: options.facts || [],
				markdown: true
			}
		],
		potentialAction:
			options.actions?.map((action) => ({
				'@type': 'OpenUri',
				name: action.title,
				targets: [
					{
						os: 'default',
						uri: action.url
					}
				]
			})) || []
	};

	return sendTeamsMessage(payload);
}

// Helper function to get theme color
function getThemeColor(color: string): string {
	const colors = {
		default: '0078D4', // Microsoft Blue
		dark: '323130',
		light: 'F3F2F1',
		accent: '8764B8', // Purple
		good: '107C10', // Green
		warning: 'FFB900', // Yellow
		attention: 'D83B01' // Red/Orange
	};
	return colors[color as keyof typeof colors] || colors.default;
}

// Additional helper functions for common notification types
export const teamsNotify = {
	// Prize claimed notification
	prizeClaimed: (message: TeamsMessage) => sendTeamsNotification(message),

	// Generic success notification
	success: async (title: string, message: string) => {
		return sendSimpleTeamsMessage({
			title: `✅ ${title}`,
			text: message,
			color: 'good'
		});
	},

	// Error/alert notification
	alert: async (title: string, message: string, actionUrl?: string) => {
		return sendSimpleTeamsMessage({
			title: `⚠️ ${title}`,
			text: message,
			color: 'attention',
			actions: actionUrl
				? [
						{
							type: 'OpenUrl',
							title: 'View Details',
							url: actionUrl
						}
					]
				: undefined
		});
	},

	// Info notification
	info: async (title: string, message: string) => {
		return sendSimpleTeamsMessage({
			title: `ℹ️ ${title}`,
			text: message,
			color: 'default'
		});
	},

	// Daily report with rich formatting
	dailyReport: async (stats: { totalUsers: number; totalRevenue: number; newSignups: number }) => {
		const adaptiveCard: TeamsCard = {
			type: 'AdaptiveCard',
			version: '1.4',
			body: [
				{
					type: 'TextBlock',
					text: '📊 Daily Report',
					weight: 'bolder',
					size: 'extraLarge'
				},
				{
					type: 'TextBlock',
					text: `Generated at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`,
					isSubtle: true,
					size: 'small'
				},
				{
					type: 'ColumnSet',
					columns: [
						{
							type: 'Column',
							width: 'stretch',
							items: [
								{
									type: 'TextBlock',
									text: '👥 Total Users',
									weight: 'bolder'
								},
								{
									type: 'TextBlock',
									text: stats.totalUsers.toLocaleString(),
									size: 'extraLarge',
									color: 'accent'
								}
							]
						},
						{
							type: 'Column',
							width: 'stretch',
							items: [
								{
									type: 'TextBlock',
									text: '💰 Revenue',
									weight: 'bolder'
								},
								{
									type: 'TextBlock',
									text: `$${stats.totalRevenue.toLocaleString()}`,
									size: 'extraLarge',
									color: 'good'
								}
							]
						},
						{
							type: 'Column',
							width: 'stretch',
							items: [
								{
									type: 'TextBlock',
									text: '📈 New Signups',
									weight: 'bolder'
								},
								{
									type: 'TextBlock',
									text: `+${stats.newSignups}`,
									size: 'extraLarge',
									color: 'accent'
								}
							]
						}
					]
				}
			]
		};

		return sendTeamsMessage({
			type: 'message',
			attachments: [
				{
					contentType: 'application/vnd.microsoft.card.adaptive',
					content: adaptiveCard
				}
			]
		});
	},

	// System status notification
	systemStatus: async (status: 'operational' | 'degraded' | 'down', message: string) => {
		const statusConfig = {
			operational: { emoji: '✅', color: 'good' as const },
			degraded: { emoji: '⚠️', color: 'warning' as const },
			down: { emoji: '🔴', color: 'attention' as const }
		};

		const config = statusConfig[status];

		return sendSimpleTeamsMessage({
			title: `${config.emoji} System Status: ${status.toUpperCase()}`,
			text: message,
			color: config.color,
			facts: [
				{ name: 'Status', value: status },
				{ name: 'Time', value: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }) }
			]
		});
	}
};
