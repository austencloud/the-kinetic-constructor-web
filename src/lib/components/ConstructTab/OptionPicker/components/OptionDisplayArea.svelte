<script lang="ts">
	// Removed fade import
	import type { PictographData } from '$lib/types/PictographData';
	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';
	// Removed any transition containers or imports

	export let isLoading: boolean;
	export let selectedTab: string | null;
	export let optionsToDisplay: PictographData[] = [];
	export let hasCategories: boolean;

	/* ───────────── what we're going to show ───────────── */
	$: hasOptions = optionsToDisplay.length > 0;

	type Msg = 'loading' | 'empty' | 'initial' | null;

	$: msgType = isLoading
		? ('loading' as Msg)
		: !hasOptions
			? selectedTab
				? ('empty' as Msg)
				: hasCategories
					? ('initial' as Msg)
					: ('empty' as Msg)
			: (null as Msg);

	function msgText(t: Msg): string {
		if (t === 'empty')
			return selectedTab === 'all'
				? 'No options match current filters.'
				: `No options for ${selectedTab}.`;
		if (t === 'initial') return 'Select a category above …';
		return '';
	}
</script>

<div class="display-wrapper">
	{#if msgType === 'loading'}
		<div class="absolute-content">
			<!-- Removed transitions -->
			<LoadingMessage />
		</div>
	{:else if msgType}
		<div class="absolute-content">
			<!-- Removed transitions -->
			<EmptyMessage type={msgType} message={msgText(msgType)} />
		</div>
	{:else}
		<div class="absolute-content">
			<!-- Direct display of options panel, no transition containers -->
			<OptionsPanel options={optionsToDisplay} {selectedTab} />
		</div>
	{/if}
</div>

<style>
	.display-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.absolute-content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>