<script lang="ts">
	import { onMount } from 'svelte';
	import type { PropInterface } from './PropInterface';

	export let prop: PropInterface;

	let transform = '';
	let svgPath = '';

	function getSvgPath(): string {
		const basePath = '/images/props/';
		return `${basePath}${prop.propType}.svg`;
	}

	onMount(() => {
		console.debug('Received Prop Data:', prop); // Debug log
		const { coords, ori } = prop;
		const rotationAngle = ori === 'in' ? 90 : 0;

		svgPath = getSvgPath();
		transform = `translate(${coords.x}px, ${coords.y}px) rotate(${rotationAngle}deg)`;
		console.debug('Transform:', transform);
	});
</script>

{#if svgPath}
	<img src={svgPath} class="prop" style="transform: {transform};" alt="Prop" />
{:else}
	<p>Prop SVG path not found.</p>
{/if}

<style>
	.prop {
		position: absolute;
		transition: all 0.3s ease;
		transform-origin: center;
		z-index: 10;
	}
</style>
