// src/lib/components/MainWidget/context/tabContext.ts
import { getContext, setContext } from 'svelte';
import type { ComponentType, SvelteComponent } from 'svelte';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { TabId } from '../state/appState';

const TAB_CONTEXT_KEY = Symbol('tab-registry');

/**
 * Interface for tab component registry
 */
export interface TabRegistry {
	/**
	 * Register a component for a specific tab ID
	 */
	register: (id: TabId, component: any) => void;

	/**
	 * Get a component for a specific tab ID
	 */
	getComponent: (id: TabId) => any | undefined;

	/**
	 * Get all registered components
	 */
	getAll: () => Map<TabId, any>;

	/**
	 * Subscribe to registry changes
	 */
	subscribe: Writable<Map<TabId, any>>['subscribe'];
}

/**
 * Create and set up the tab registry in context
 */
export function createTabRegistry(): TabRegistry {
	// Create a store to track registered components
	const componentMap = new Map<TabId, any>();
	const store = writable<Map<TabId, any>>(componentMap);

	// Create the registry interface
	const registry: TabRegistry = {
		register(id, component) {
			componentMap.set(id, component);
			store.set(componentMap);
		},

		getComponent(id) {
			return componentMap.get(id);
		},

		getAll() {
			return new Map(componentMap);
		},

		subscribe: store.subscribe
	};

	// Set the registry in context
	setContext(TAB_CONTEXT_KEY, registry);

	return registry;
}

/**
 * Get the tab registry from context
 */
export function getTabRegistry(): TabRegistry {
	return getContext<TabRegistry>(TAB_CONTEXT_KEY);
}
