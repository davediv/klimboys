<script lang="ts">
	import '../app.css';
	import NotificationToast from '$lib/components/NotificationToast.svelte';

	let { children } = $props();
</script>

<NotificationToast />
{@render children()}
