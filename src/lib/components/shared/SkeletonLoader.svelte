<script lang="ts">
	// Props using Svelte 5 runes
	const {
		type = 'rectangle',
		width = '100%',
		height = '20px',
		borderRadius = '4px',
		animate = true,
		delay = 0
	} = $props<{
		type?: 'rectangle' | 'circle' | 'text' | 'pictograph' | 'button';
		width?: string;
		height?: string;
		borderRadius?: string;
		animate?: boolean;
		delay?: number;
	}>();
</script>

<div
	class="skeleton-loader {type}"
	class:animate
	style="
		--width: {width};
		--height: {height};
		--border-radius: {borderRadius};
		--animation-delay: {delay}ms;
	"
>
	{#if type === 'pictograph'}
		<div class="pictograph-grid"></div>
		<div class="pictograph-elements">
			<div class="pictograph-prop left"></div>
			<div class="pictograph-prop right"></div>
			<div class="pictograph-arrow left"></div>
			<div class="pictograph-arrow right"></div>
		</div>
	{/if}
</div>

<style>
	.skeleton-loader {
		display: block;
		width: var(--width);
		height: var(--height);
		border-radius: var(--border-radius);
		background-color: rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
	}

	.skeleton-loader.animate::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		animation: shimmer 1.5s infinite;
		animation-delay: var(--animation-delay);
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.skeleton-loader.circle {
		border-radius: 50%;
	}

	.skeleton-loader.text {
		margin-bottom: 8px;
	}

	.skeleton-loader.pictograph {
		aspect-ratio: 1/1;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 10px;
	}

	.pictograph-grid {
		position: absolute;
		top: 10%;
		left: 10%;
		width: 80%;
		height: 80%;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.pictograph-grid::before,
	.pictograph-grid::after {
		content: '';
		position: absolute;
		background-color: rgba(255, 255, 255, 0.2);
	}

	.pictograph-grid::before {
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
	}

	.pictograph-grid::after {
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
	}

	.pictograph-elements {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.pictograph-prop {
		position: absolute;
		width: 15%;
		height: 15%;
		border-radius: 50%;
	}

	.pictograph-prop.left {
		top: 30%;
		left: 30%;
		background-color: rgba(255, 0, 0, 0.3);
	}

	.pictograph-prop.right {
		top: 30%;
		right: 30%;
		background-color: rgba(0, 0, 255, 0.3);
	}

	.pictograph-arrow {
		position: absolute;
		width: 20%;
		height: 8%;
		border-radius: 4px;
	}

	.pictograph-arrow.left {
		top: 60%;
		left: 25%;
		background-color: rgba(255, 0, 0, 0.3);
		transform: rotate(45deg);
	}

	.pictograph-arrow.right {
		top: 60%;
		right: 25%;
		background-color: rgba(0, 0, 255, 0.3);
		transform: rotate(-45deg);
	}
</style>
