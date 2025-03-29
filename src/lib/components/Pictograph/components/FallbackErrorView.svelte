<script lang="ts">
	export let error: Error;
	export let errorInfo: string = '';
	export let reset: () => void;
</script>

<g class="error-view">
	<rect width="100%" height="100%" fill="#fff1f1" rx="8" ry="8" />

	<g transform="translate(475, 400)">
		<!-- Error icon -->
		<circle cx="0" cy="0" r="60" fill="#f56565" />
		<text
			x="0"
			y="0"
			dominant-baseline="middle"
			text-anchor="middle"
			font-size="60"
			fill="white"
			font-weight="bold"
		>
			!
		</text>

		<!-- Error message -->
		<text
			x="0"
			y="100"
			dominant-baseline="middle"
			text-anchor="middle"
			font-size="16"
			fill="#4a5568"
			font-weight="bold"
		>
			Error Rendering Pictograph
		</text>

		<text
			x="0"
			y="130"
			dominant-baseline="middle"
			text-anchor="middle"
			font-size="14"
			fill="#718096"
		>
			{error.message || 'An unexpected error occurred'}
		</text>

		{#if errorInfo}
			<text
				x="0"
				y="160"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="12"
				fill="#a0aec0"
			>
				{errorInfo}
			</text>
		{/if}

		<!-- Retry button -->
		<g
			transform="translate(0, 200)"
			on:click|stopPropagation={reset}
			class="retry-button"
			role="button"
			tabindex="0"
			on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && reset()}
		>
			<rect x="-60" y="-20" width="120" height="40" rx="20" ry="20" fill="#4299e1" />
			<text
				x="0"
				y="0"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="14"
				fill="white"
				font-weight="bold"
			>
				Try Again
			</text>
		</g>
	</g>
</g>

<style>
	.retry-button {
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.retry-button:hover {
		transform: scale(1.05);
	}

	.retry-button:active {
		transform: scale(0.95);
	}
</style>
