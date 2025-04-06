<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Motion } from 'svelte-motion';
	import { cubicOut } from 'svelte/easing';

	import ShowAllButton from './buttons/ShowAllButton.svelte';
	import HeaderControls from './HeaderControls.svelte'; // Tabs
	import SortOptions from './FilterControls/SortOptions.svelte';

	// --- Props ---
	export let showAllActive: boolean;
	export let isMobileDevice: boolean;
	export let categoryKeys: string[];
	export let selectedTab: string | null;

	// --- Exported Element Reference ---
	// This variable will hold the reference to the root div element
	export let rootElement: HTMLDivElement | null = null;

	// --- Events ---
	const dispatch = createEventDispatcher<{
		toggleShowAll: void; // No data needed for this event
		tabSelect: string; // Dispatch the selected tab key
	}>();

	// --- Event Handlers ---
	// Handler for the ShowAllButton's toggle event
	function handleToggleShowAll() {
		dispatch('toggleShowAll');
	}

	// --- Animation States ---
	const motionTransition = {
		duration: 0.4,
		ease: cubicOut
	};

	// State when tabs/sort are hidden (Show All active)
	const hiddenState = {
		opacity: 0,
		scale: 0.9,
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 0,
		margin: 0,
		pointerEvents: 'none' as const
	};

	// State when tabs are visible
	const tabsVisibleState = {
		opacity: 1,
		scale: 1,
		flexGrow: 1, // Allow tabs to take available space
		flexShrink: 1,
		flexBasis: 'auto',
		margin: '0 0.25rem',
		pointerEvents: 'auto' as const
	};

	// State when sort options are visible
	const sortVisibleState = {
		opacity: 1,
		scale: 1,
		flexGrow: 0, // Don't allow sort to grow
		flexShrink: 0,
		flexBasis: 'auto',
		margin: '0 0.25rem',
		pointerEvents: 'auto' as const
	};

	// State for the Show All button container (alignment changes)
	const showAllContainerState = {
		visible: { flexGrow: 0, flexShrink: 0, justifyContent: 'flex-start' },
		centered: { flexGrow: 1, flexShrink: 0, justifyContent: 'center' }
	};

	// --- Reactive Animation States ---
	$: tabsAnimate = showAllActive ? hiddenState : tabsVisibleState;
	$: sortAnimate = showAllActive ? hiddenState : sortVisibleState;
	$: showAllAnimate = showAllActive
		? showAllContainerState.centered
		: showAllContainerState.visible;
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} bind:this={rootElement}>
	<div class="header-controls" class:centered-mode={showAllActive}>
		<Motion
			layout
			animate={showAllAnimate}
			transition={motionTransition}
			initial={false}
			let:motion
		>
			<div class="show-all-container" use:motion>
				<ShowAllButton {showAllActive} {isMobileDevice} onToggle={handleToggleShowAll} />
			</div>
		</Motion>

		<Motion layout animate={tabsAnimate} transition={motionTransition} initial={false} let:motion>
			<div class="tabs-container" use:motion>
				<HeaderControls
					{categoryKeys}
					{selectedTab}
					{isMobileDevice}
					onTabSelect={(tab) => dispatch('tabSelect', tab)}
				/>
			</div>
		</Motion>

		<Motion layout animate={sortAnimate} transition={motionTransition} initial={false} let:motion>
			<div class="sort-container" use:motion>
				<SortOptions {isMobileDevice} />
			</div>
		</Motion>
	</div>
</div>

<style>
	/* Styles remain the same */
	.option-picker-header {
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 10px;
		min-height: 50px;
		box-sizing: border-box;
	}

	.option-picker-header.mobile {
		padding-top: 5px;
		min-height: 40px;
		margin-bottom: 0.3rem;
	}

	.header-controls {
		display: flex;
		align-items: center;
		width: 100%;
		flex-wrap: wrap;
	}

	.header-controls.centered-mode {
		justify-content: center;
	}

	.show-all-container,
	.tabs-container,
	.sort-container {
		display: flex;
		align-items: center;
		flex-basis: auto;
	}

	.show-all-container {
		flex-shrink: 0;
		flex-grow: 0;
	}

	.tabs-container {
		justify-content: center;
		min-width: 0;
		flex-shrink: 1;
		flex-grow: 1;
		overflow: hidden;
	}

	.sort-container {
		justify-content: flex-end;
		flex-shrink: 0;
		flex-grow: 0;
	}

	@media (max-width: 480px) {
		.header-controls {
			flex-direction: column;
		}

		.show-all-container,
		.tabs-container,
		.sort-container {
			width: 100%;
			justify-content: center;
			flex-basis: auto !important;
			flex-grow: 1;
			flex-shrink: 0;
			margin: 0.25rem 0;
		}

		:global(.header-controls .tabs-container[style*='opacity: 0;']),
		:global(.header-controls .sort-container[style*='opacity: 0;']) {
			margin: 0 !important;
			height: 0;
			overflow: hidden;
		}

		.tabs-container { order: 2; }
		.sort-container { order: 3; }
		.show-all-container { order: 1; }

		.header-controls.centered-mode {
			flex-direction: column;
			justify-content: center;
		}
		.header-controls.centered-mode .show-all-container {
			width: 100%;
		}
	}
</style>
