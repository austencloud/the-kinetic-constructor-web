<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';

	// Props
	let {
		children
	}: {
		children?: import('svelte').Snippet;
	} = $props();

	const SCOPE_KEY = Symbol('SERVICE_SCOPE');

	let scope: symbol;

	onMount(() => {
		const container = getContainer();
		scope = container.beginScope();
		setContext(SCOPE_KEY, scope);
	});

	onDestroy(() => {
		if (scope) {
			const container = getContainer();
			container.endScope(scope);
		}
	});
</script>

{#if children}
	{@render children()}
{/if}
