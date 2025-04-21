<script lang="ts">
	import { onMount } from 'svelte';
	import { getContainer } from '$lib/core/di/ContainerProvider';
	import { setServiceContainer } from '$lib/core/di/serviceContext';
	import { registerServices } from '$lib/core/di/registerServices';

	onMount(() => {
		const container = getContainer();
		registerServices(container);
		setServiceContainer(container);
	});
</script>

<slot></slot>
