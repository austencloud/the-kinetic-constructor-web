<script lang="ts" context="module">
	// Define toast interface
	export interface ToastItem {
		id: string;
		message: string;
		type: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		action?: {
			label: string;
			onClick: () => void;
		} | null;
	}

	// Create reactive state for toasts using Svelte 5 runes
	let toastState = $state<ToastItem[]>([]);

	// Getter function for accessing toasts
	export function getToasts(): ToastItem[] {
		return toastState;
	}

	// Add a toast
	export function addToast(toast: Omit<ToastItem, 'id'>) {
		const id = Math.random().toString(36).substring(2, 9);
		toastState = [...toastState, { ...toast, id }];

		// Auto-remove toast after duration
		if (toast.duration !== 0) {
			const duration = toast.duration || 5000;
			setTimeout(() => {
				removeToast(id);
			}, duration);
		}

		return id;
	}

	// Remove a toast by ID
	export function removeToast(id: string) {
		toastState = toastState.filter((t) => t.id !== id);
	}

	// Show a success toast
	export function showSuccess(
		message: string,
		options: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>> = {}
	) {
		return addToast({ message, type: 'success', ...options });
	}

	// Show an error toast
	export function showError(
		message: string,
		options: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>> = {}
	) {
		return addToast({ message, type: 'error', ...options });
	}

	// Show a warning toast
	export function showWarning(
		message: string,
		options: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>> = {}
	) {
		return addToast({ message, type: 'warning', ...options });
	}

	// Show an info toast
	export function showInfo(
		message: string,
		options: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>> = {}
	) {
		return addToast({ message, type: 'info', ...options });
	}
</script>

<script lang="ts">
	import Toast from './Toast.svelte';

	// Get reactive access to toasts
	const toasts = $derived(getToasts());
</script>

<div class="toast-manager">
	{#each toasts as toast (toast.id)}
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
