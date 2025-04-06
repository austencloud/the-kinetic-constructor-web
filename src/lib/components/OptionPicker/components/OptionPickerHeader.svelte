<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import ViewControl from './ViewControl.svelte';
	import type { ViewModeDetail } from './ViewControl.svelte';

	// --- Props ---
	// ADDED: Receive selectedTab value from parent
	export let selectedTab: string | null;

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: isMobileDevice = $layoutContext.isMobile;

	// --- Events ---
	const dispatch = createEventDispatcher<{ viewChange: ViewModeDetail }>();

	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		dispatch('viewChange', event.detail);
	}
</script>

<div
	class="option-picker-header"
	class:mobile={isMobileDevice}
	data-testid="option-picker-header"
>
	<div class="header-content">
		<ViewControl selectedTabValue={selectedTab} on:viewChange={handleViewChange} />
	</div>
</div>

<style>
	/* Styles remain the same */
	.option-picker-header {
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 8px;
		min-height: auto;
		box-sizing: border-box;
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}
	.option-picker-header.mobile {
		padding-top: 4px;
		margin-bottom: 0.3rem;
		justify-content: center;
	}
	.header-content {
		display: flex;
	}
</style>
