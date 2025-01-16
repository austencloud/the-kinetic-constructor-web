<script lang="ts">
	import { onMount } from 'svelte';

	// We track if we are currently in fullscreen or not
	let isFull = false;
	let fsContainer: HTMLDivElement | null = null;
	let fullscreenSupport = false;
	let exitFullscreen: () => void = () => {};
	let requestFullscreen: () => void = () => {};

	onMount(() => {
		// Check for browser API
		fullscreenSupport = !!(
			document.fullscreenEnabled ||
			(document as any).webkitFullscreenEnabled ||
			(document as any).mozFullScreenEnabled ||
			(document as any).msFullscreenEnabled
		);

		// "Exit" and "Request" utility
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

		// Optional: Insert icon font for a material "fullscreen" icon
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
		document.head.appendChild(link);

		return () => {
			link.parentNode?.removeChild(link);
		};
	});

	// Toggling
	function fsToggle() {
		if (!fullscreenSupport) return;
		if (isFull) {
			exitFullscreen.call(document);
		} else {
			requestFullscreen();
		}
		isFull = !isFull;
	}
</script>

<!-- 
     The 'fsContainer' is where we attach the fullscreen. 
     We put a slot inside, so the parent can place anything within.
-->
<div class="fullscreen-container {isFull ? 'isFull' : ''}" bind:this={fsContainer}>
	<!-- Expose isFull to the slot for convenience 
             so parent can do <slot {isFull}> if desired. -->
	<slot {isFull} />
	{#if fullscreenSupport}
		<button class="fs-btn" on:click={fsToggle}>
			<i class="material-icons">
				{#if isFull}fullscreen_exit{:else}fullscreen{/if}
			</i>
		</button>
	{/if}
</div>

<style>
	.fullscreen-container {
		position: relative;
		width: 100%;
		height: 100%; /* Ensure it matches the parent's height */
		overflow: hidden; /* Prevent scrollbars inside the container */
	}

	/* If you want a special look when in FS, optional: */

	.fs-btn {
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
	}
	.material-icons {
		font-size: 28px;
	}
</style>
