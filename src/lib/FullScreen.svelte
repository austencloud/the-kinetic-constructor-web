<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	let isFull = false;
	let fsContainer: HTMLDivElement | null = null;
	let fullscreenSupport = false;
	let exitFullscreen: () => void = () => {};
	let requestFullscreen: () => void = () => {};

	const dispatch = createEventDispatcher<{ toggleFullscreen: boolean }>();

	onMount(() => {
		const doc = document as Document & {
			webkitFullscreenEnabled?: boolean;
			mozFullScreenEnabled?: boolean;
			msFullscreenEnabled?: boolean;
			mozCancelFullScreen?: () => void;
			webkitExitFullscreen?: () => void;
			msExitFullscreen?: () => void;
		};

		fullscreenSupport = !!(
			document.fullscreenEnabled ||
			doc.webkitFullscreenEnabled ||
			doc.mozFullScreenEnabled ||
			doc.msFullscreenEnabled
		);

		exitFullscreen =
			document.exitFullscreen ||
			doc.mozCancelFullScreen ||
			doc.webkitExitFullscreen ||
			doc.msExitFullscreen ||
			(() => {});

		requestFullscreen = () => {
			if (!fsContainer) return;
			const el = fsContainer as HTMLElement & {
				mozRequestFullScreen?: () => void;
				webkitRequestFullscreen?: () => void;
				msRequestFullscreen?: () => void;
			};
			const req =
				el.requestFullscreen ||
				el.mozRequestFullScreen ||
				el.webkitRequestFullscreen ||
				el.msRequestFullscreen ||
				(() => {});
			req.call(el);
		};
	});

	function fsToggle() {
		if (!fullscreenSupport) return;
		isFull ? exitFullscreen.call(document) : requestFullscreen();
		isFull = !isFull;

		dispatch('toggleFullscreen', isFull);

		window.dispatchEvent(new Event('resize'));
	}
</script>

<div class="fullscreen-container {isFull ? 'isFull' : ''}" bind:this={fsContainer}>
	<slot {isFull} />
	{#if fullscreenSupport}
		<button
			class="fs-btn"
			on:click={fsToggle}
			aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
		>
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
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.fs-btn {
		z-index: 9999;
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
		transition:
			transform 0.2s,
			box-shadow 0.2s;
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
