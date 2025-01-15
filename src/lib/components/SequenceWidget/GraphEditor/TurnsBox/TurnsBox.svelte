<script lang="ts">
	import TurnsBoxHeader from './TurnsBoxHeader/TurnsBoxHeader.svelte';
	import TurnsWidget from './TurnsWidget/TurnsWidget.svelte';

	export let color: 'blue' | 'red';
</script>

<div
	class="turns-box"
	style="--box-color: {color === 'blue' ? '#2e3192' : '#ed1c24'}; --box-gradient: {color === 'blue'
		? 'linear-gradient(135deg, rgba(46, 49, 146, 0.1), rgba(46, 49, 146, 0.3))'
		: 'linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(237, 28, 36, 0.3))'};"
>
	<TurnsBoxHeader {color} />
	<TurnsWidget {color} />
</div>

<style>
	.turns-box {
		flex: 1; /* Expand to fill the remaining space both width and height */
		border: 4px solid var(--box-color);
		border-radius: 5px;
		display: flex;
		flex-direction: column;
		background: var(--box-gradient);
		align-self: stretch;
		height: 100%; /* Ensure full height stretching */
		min-width: 0; /* Prevent content overflow issues */
	}
</style>
