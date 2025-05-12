<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from './Beat.svelte';
	import SelectionBorderOverlay from './SelectionBorderOverlay.svelte';
	import type { BeatData } from './BeatData';

	const props = $props<{
		beat: BeatData;
		onClick: () => void;
		isSelected?: boolean;
		animationDelay?: number;
	}>();

	const isSelected = $derived(props.isSelected ?? false);
	const animationDelay = $derived(props.animationDelay ?? 0);

	let shouldAnimate = $state(true);
	let hasAnimated = $state(false);
	let isVisible = $state(false);

	onMount(() => {
		setTimeout(() => {
			isVisible = true;
		}, animationDelay);
	});

	function handleAnimationEnd() {
		if (!hasAnimated && shouldAnimate) {
			hasAnimated = true;
		}
	}
</script>

<div
	class="animated-beat-container"
	class:animate={shouldAnimate && !hasAnimated && isVisible}
	class:visible={isVisible}
	onanimationend={handleAnimationEnd}
>
	<Beat beat={props.beat} onClick={props.onClick} />

	{#if isSelected}
		<SelectionBorderOverlay pictographData={props.beat.pictographData} {isSelected} />
	{/if}
</div>

<style>
	.animated-beat-container {
		width: 100%;
		height: 100%;
		position: relative;
		transform: scale(0.8);
		transition: transform 0.3s ease;
	}

	.visible {
		transform: scale(1);
	}

	.animate {
		animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes scaleIn {
		0% {
			transform: scale(0.6);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Selection indicator replaced with SelectionBorderOverlay component */
</style>
