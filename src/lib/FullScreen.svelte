<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	let isFull = false;
	let fsContainer: HTMLDivElement | null = null;
	let fullscreenSupport = false;
	let exitFullscreen: () => void = () => {};
	let requestFullscreen: () => void = () => {};

	const dispatch = createEventDispatcher<{ toggleFullscreen: boolean }>();

	onMount(() => {
		fullscreenSupport = !!(
			document.fullscreenEnabled ||
			(document as any).webkitFullscreenEnabled ||
			(document as any).mozFullScreenEnabled ||
			(document as any).msFullscreenEnabled
		);

		exitFullscreen =
			document.exitFullscreen ||
			(document as any).mozCancelFullScreen ||
			(document as any).webkitExitFullscreen ||
			(document as any).msExitFullscreen ||
			(() => {});

		requestFullscreen = () => {
			const el = fsContainer;
			if (!el) return;
			const req =
				el.requestFullscreen ||
				(el as any).mozRequestFullScreen ||
				(el as any).webkitRequestFullscreen ||
				(el as any).msRequestFullscreen ||
				(() => {});
			req.call(el);
		};
	});

	function fsToggle() {
		if (!fullscreenSupport) return;
		if (isFull) {
			exitFullscreen.call(document);
		} else {
			requestFullscreen();
		}
		isFull = !isFull;

		// Emit the fullscreen state
		dispatch('toggleFullscreen', isFull);

		// Trigger a resize event to ensure all components adjust their layout
		const resizeEvent = new Event('resize');
		window.dispatchEvent(resizeEvent);
	}
</script>

<div class="fullscreen-container {isFull ? 'isFull' : ''}" bind:this={fsContainer}>
	<slot {isFull} />
	{#if fullscreenSupport}
		<button class="fs-btn" on:click={fsToggle} aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}>
			<i class="fa {isFull ? 'fa-compress' : 'fa-expand'}"></i>
		</button>
	{/if}
</div>
<style>
	@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

	.fullscreen-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.fs-btn {
		z-index: 9999;
    /* pointer-events: all; */
    
		position: absolute;
		right: 20px;
		bottom: 20px;
		border: none;
		background: #fff;
		cursor: pointer;
		font-size: 1.5rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		border-radius: 50%;
		width: 48px;
		height: 48px;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.fs-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.fs-btn:active {
		transform: scale(0.9);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
	}
</style>
