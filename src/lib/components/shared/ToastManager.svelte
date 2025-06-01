<script lang="ts" context="module">
	// Re-export from utils for backward compatibility
	export {
		type ToastItem,
		toasts,
		addToast,
		removeToast,
		showSuccess,
		showError,
		showWarning,
		showInfo
	} from './toastUtils';
</script>

<script lang="ts">
	import Toast from './Toast.svelte';
	import { toasts, removeToast } from './toastUtils';
</script>

<div class="toast-manager">
	{#each $toasts as toast (toast.id)}
		<div class="toast-wrapper">
			<Toast
				message={toast.message}
				type={toast.type}
				duration={0}
				action={toast.action}
				on:close={() => removeToast(toast.id)}
			/>
			<!-- We handle duration in the manager -->
		</div>
	{/each}
</div>

<style>
	.toast-manager {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 9999;
		pointer-events: none;
	}

	.toast-wrapper {
		pointer-events: auto;
	}
</style>
