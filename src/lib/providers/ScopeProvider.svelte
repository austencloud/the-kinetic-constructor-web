<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';

	const SCOPE_KEY = Symbol('SERVICE_SCOPE');

	export let name = 'default-scope';

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

<slot></slot>
