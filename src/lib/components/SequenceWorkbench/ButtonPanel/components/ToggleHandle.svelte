<script lang="ts">
	// Props using Svelte 5 runes
	const {
		buttonSize,
		isVisible = true,
		isPulsing = false,
		ontoggle
	} = $props<{
		buttonSize: number;
		isVisible?: boolean;
		isPulsing?: boolean;
		ontoggle?: () => void;
	}>();

	function handleToggleClick() {
		ontoggle?.();
	}
</script>

<div
	class="toggle-handle-container"
	class:pulsing={isPulsing}
	style="width: {buttonSize}px; height: {buttonSize}px;"
>
	<button
		class="toggle-handle ripple"
		onclick={handleToggleClick}
		title={isVisible ? 'Hide Tools' : 'Show Tools'}
		aria-label={isVisible ? 'Hide Tools' : 'Show Tools'}
		aria-expanded={isVisible}
		data-mdb-ripple="true"
	>
		<span class="tools-emoji">🛠️</span>
	</button>
</div>

<style>
	.toggle-handle-container {
		position: absolute;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		top: 50%;
		right: -30px;
		transform: translateY(-50%);
	}

	.toggle-handle {
		width: 100%;
		height: 100%;
		background: white;
		color: #333;
		border: 2px solid #3a7bd5;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition: all 0.2s ease-in-out;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.toggle-handle:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		background: #3a7bd5;
		color: white;
	}

	.toggle-handle:active {
		transform: scale(0.95);
	}

	.tools-emoji {
		font-size: 1.2em;
	}

	/* Pulse animation */
	.toggle-handle-container.pulsing .toggle-handle {
		animation: pulse 2s infinite ease-in-out;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
		50% {
			transform: scale(1.1);
			box-shadow: 0 4px 16px rgba(58, 123, 213, 0.3);
		}
	}
</style>
