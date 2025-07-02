<script lang="ts">
	import { CheckCircle, XCircle, Info, AlertTriangle } from '@lucide/svelte';
	import { notifications, type Notification } from '$lib/stores/notifications';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	// Get icon and styles based on notification type
	function getNotificationConfig(type: Notification['type']) {
		switch (type) {
			case 'success':
				return {
					icon: CheckCircle,
					class: 'alert-success',
					iconClass: 'text-white'
				};
			case 'error':
				return {
					icon: XCircle,
					class: 'alert-error',
					iconClass: 'text-white'
				};
			case 'warning':
				return {
					icon: AlertTriangle,
					class: 'alert-warning',
					iconClass: 'text-white'
				};
			case 'info':
			default:
				return {
					icon: Info,
					class: 'alert-info',
					iconClass: 'text-white'
				};
		}
	}
</script>

<!-- Notification Container -->
<div class="pointer-events-none fixed top-4 right-4 z-50">
	<div class="pointer-events-auto flex flex-col gap-2">
		{#each $notifications as notification (notification.id)}
			{@const config = getNotificationConfig(notification.type)}
			{@const Icon = config.icon}
			<div
				class="alert {config.class} relative max-w-md min-w-[320px] overflow-hidden border-l-4 border-current shadow-lg"
				in:fly={{ x: 100, duration: 300 }}
				out:fade={{ duration: 200 }}
				animate:flip={{ duration: 200 }}
			>
				<Icon class="h-6 w-6 {config.iconClass} flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-semibold">{notification.title}</h3>
					{#if notification.message}
						<p class="mt-1 text-sm opacity-90">{notification.message}</p>
					{/if}
				</div>
				{#if notification.action}
					<button
						class="btn btn-sm btn-ghost"
						onclick={() => {
							notification.action?.handler();
							notifications.remove(notification.id);
						}}
					>
						{notification.action.label}
					</button>
				{/if}
				{#if notification.duration && notification.duration > 0}
					<div
						class="progress-bar absolute bottom-0 left-0 h-1 bg-current opacity-20"
						style="animation-duration: {notification.duration}ms;"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Ensure notifications stack properly on mobile */
	@media (max-width: 640px) {
		.fixed {
			left: 1rem;
			right: 1rem;
		}
	}

	/* Progress bar animation */
	.progress-bar {
		width: 100%;
		transform-origin: left;
		animation: shrink linear forwards;
	}

	@keyframes shrink {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	/* Enhanced notification styles */
	.alert {
		transition: all 0.2s ease;
	}

	.alert:hover {
		transform: translateX(-4px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
</style>
