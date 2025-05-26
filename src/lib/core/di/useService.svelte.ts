import { onMount } from 'svelte';
import { getService } from './serviceContext';
import type { ServiceToken } from './ServiceTokens';

export function useService<T>(token: string | ServiceToken): {
	service: () => T | null;
	isReady: () => boolean;
} {
	let service = $state<T | null>(null);
	let isReady = $state(false);

	onMount(() => {
		try {
			const instance = getService<T>(token);
			service = instance;
			isReady = true;
		} catch (error) {
			console.error(`Error getting service ${token}:`, error);
			isReady = false;
		}

		return () => {
			service = null;
			isReady = false;
		};
	});

	return {
		service: () => service,
		isReady: () => isReady
	};
}
