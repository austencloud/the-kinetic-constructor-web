import { writable } from 'svelte/store';

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

// Create a writable store for toasts
export const toasts = writable<ToastItem[]>([]);

// Add a toast
export function addToast(toast: Omit<ToastItem, 'id'>) {
	const id = Math.random().toString(36).substring(2, 9);
	toasts.update((all) => [...all, { ...toast, id }]);

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
	toasts.update((all) => all.filter((t) => t.id !== id));
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
