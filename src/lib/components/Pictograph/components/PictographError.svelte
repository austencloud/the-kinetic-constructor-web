<script lang="ts">
	import { popIn } from '$lib/transitions/popIn';

	// Convert to Svelte 5 runes syntax
	const { errorMessage = null, animationDuration = 200 } = $props<{
		errorMessage?: string | null;
		animationDuration?: number;
	}>();
</script>

<g in:popIn={{ duration: animationDuration, start: 0.85, opacity: 0.2 }}>
	<circle cx="475" cy="450" r="40" fill="#fed7d7" />
	<text
		x="475"
		y="450"
		dominant-baseline="middle"
		text-anchor="middle"
		font-size="40"
		fill="#e53e3e"
	>
		!
	</text>
	<text
		x="475"
		y="520"
		dominant-baseline="middle"
		text-anchor="middle"
		font-size="18"
		fill="#e53e3e"
	>
		Error
	</text>
	<text
		x="475"
		y="550"
		dominant-baseline="middle"
		text-anchor="middle"
		font-size="14"
		fill="#718096"
	>
		{errorMessage || 'Unknown error'}
	</text>
</g>
