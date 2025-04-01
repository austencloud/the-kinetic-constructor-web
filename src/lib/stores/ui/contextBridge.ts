// src/lib/stores/ui/contextBridge.ts
import { setContext, getContext, hasContext } from 'svelte';
import { derived, writable, type Writable } from 'svelte/store';

/**
 * Type-safe context creator for component-scoped state
 * This utility simplifies the creation and consumption of Svelte contexts
 * while maintaining type safety and providing a consistent API.
 */
export function createTypedContext<T extends Record<string, any>>(key: string, initialContext: T) {
	return {
		/**
		 * Set the context for the current component
		 * @returns The context object for chaining
		 */
		setContext: () => {
			setContext(key, initialContext);
			return initialContext;
		},

		/**
		 * Get the context from an ancestor component
		 * @throws Error if context does not exist
		 */
		getContext: () => {
			if (!hasContext(key)) {
				throw new Error(
					`Context with key "${key}" not found. Make sure it's set in an ancestor component.`
				);
			}
			return getContext<T>(key);
		},

		/**
		 * Check if the context exists in the component tree
		 */
		hasContext: () => hasContext(key)
	};
}

/**
 * Create a store-based context with built-in actions
 * This is useful for component state that needs to be reactive
 */
export function createStoreContext<T>(key: string, initialData: T) {
	// Create the store
	const store = writable<T>(initialData);

	// Create the context object
	const contextValue = {
		// The writable store
		store,

		// Helper method to update partial state
		update: (updater: (data: T) => T) => {
			store.update(updater);
		},

		// Helper method to set partial state
		setPartial: (partial: Partial<T>) => {
			store.update((data) => ({ ...data, ...partial }));
		},

		// Reset to initial state
		reset: () => {
			store.set(initialData);
		}
	};

	// Return context functions
	return {
		/**
		 * Set the store context for the current component
		 */
		setContext: () => {
			setContext(key, contextValue);
			return contextValue;
		},

		/**
		 * Get the store context from an ancestor component
		 */
		getContext: () => {
			if (!hasContext(key)) {
				throw new Error(
					`Store context with key "${key}" not found. Make sure it's set in an ancestor component.`
				);
			}
			return getContext<typeof contextValue>(key);
		},

		/**
		 * Create a derived context that depends on the original
		 * Useful for creating specialized sub-contexts
		 */
		deriveContext: <U>(
			derivedKey: string,
			deriveFn: (data: T) => U,
			actions?: Record<string, (data: U) => void>
		) => {
			return {
				setContext: () => {
					const derived = {
						getData: () => deriveFn(initialData),
						...actions
					};
					setContext(derivedKey, derived);
					return derived;
				},
				getContext: () => {
					if (!hasContext(derivedKey)) {
						throw new Error(`Derived context with key "${derivedKey}" not found.`);
					}
					return getContext<typeof derived>(derivedKey);
				}
			};
		}
	};
}

// Example usage:
// Define a type for the context data
interface SequenceWorkbenchContext {
	isDragging: boolean;
	hoveredBeatIndex: number | null;
	sequenceLength: number;
}

// Create a context with initial data
export const sequenceWorkbenchContext = createStoreContext<SequenceWorkbenchContext>(
	'sequence-workbench-context',
	{
		isDragging: false,
		hoveredBeatIndex: null,
		sequenceLength: 0
	}
);

// Usage in a component:
/*
<script>
    import { sequenceWorkbenchContext } from './contextBridge';
    
    // In parent component
    const { store, setPartial } = sequenceWorkbenchContext.setContext();
    
    // Subscribe to the store
    $: isDragging = $store.isDragging;
    
    // Update state
    function startDrag() {
        setPartial({ isDragging: true });
    }
    
    function endDrag() {
        setPartial({ isDragging: false });
    }
</script>

<script>
    // In child component
    import { sequenceWorkbenchContext } from './contextBridge';
    
    // Get context from parent
    const { store, setPartial } = sequenceWorkbenchContext.getContext();
    
    // Reactive reference to store values
    $: hoveredBeatIndex = $store.hoveredBeatIndex;
    
    // Update context from child
    function handleMouseOver(index) {
        setPartial({ hoveredBeatIndex: index });
    }
    
    function handleMouseOut() {
        setPartial({ hoveredBeatIndex: null });
    }
</script>
*/
