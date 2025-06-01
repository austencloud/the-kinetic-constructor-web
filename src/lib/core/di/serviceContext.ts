import { getContext } from 'svelte';
import type { ServiceContainer } from './ServiceContainer';
import type { ServiceToken } from './ServiceTokens';

export const CONTAINER_KEY = Symbol('SERVICE_CONTAINER');

export function getServiceContainer(): ServiceContainer {
	return getContext(CONTAINER_KEY);
}

export function getService<T>(token: string): T {
	const container = getServiceContainer();
	return container.get<T>(token);
}

// Legacy function for backward compatibility - now just returns the container
// Context is set directly in ServiceProvider.svelte during component initialization
export function setServiceContainer(container: ServiceContainer): void {
	// This function is now deprecated - context is set synchronously in ServiceProvider
	console.warn(
		'setServiceContainer is deprecated. Context is now set directly in ServiceProvider.svelte'
	);
}
