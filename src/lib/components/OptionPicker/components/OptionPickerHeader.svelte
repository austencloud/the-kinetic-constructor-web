<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte'; // Import getContext
	import { Motion } from 'svelte-motion';
	import { cubicOut } from 'svelte/easing';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext'; // Import context key and type

	import HeaderControls from './HeaderControls.svelte';
	import SortOptions from './SortOptions.svelte';
	import ShowAllButton from './ShowAllButton.svelte';

	// Props
	export let showAllActive: boolean;
	export let categoryKeys: string[];
	export let selectedTab: string | null;
	// REMOVED: isMobileDevice

	// Element reference for ResizeObserver (optional if not used for layout)
	// export let rootElement: HTMLDivElement | null = null;

	// Consume context
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: isMobileDevice = $layoutContext.isMobile; // Get from context

	// Events
	const dispatch = createEventDispatcher<{
		toggleShowAll: void;
		tabSelect: string;
	}>();

	// Animation configuration (remains the same)
	const animations = {
		transition: { duration: 0.4, ease: cubicOut },
		hidden: {
			opacity: 0,
			scale: 0.9,
			flexGrow: 0,
			flexShrink: 1,
			flexBasis: 0,
			margin: 0,
			pointerEvents: 'none' as const
		},
		tabs: {
			visible: {
				opacity: 1,
				scale: 1,
				flexGrow: 1,
				flexShrink: 1,
				flexBasis: 'auto',
				margin: '0 0.25rem',
				pointerEvents: 'auto' as const
			}
		},
		sort: {
			visible: {
				opacity: 1,
				scale: 1,
				flexGrow: 0,
				flexShrink: 0,
				flexBasis: 'auto',
				margin: '0 0.25rem',
				pointerEvents: 'auto' as const
			}
		},
		showAll: {
			normal: { flexGrow: 0, flexShrink: 0, justifyContent: 'flex-start' },
			centered: { flexGrow: 1, flexShrink: 0, justifyContent: 'center' }
		}
	};

	// Reactive animation states (use isMobileDevice from context via reactive declaration)
	$: tabsAnimate = showAllActive ? animations.hidden : animations.tabs.visible;
	$: sortAnimate = showAllActive ? animations.hidden : animations.sort.visible;
	$: showAllAnimate = showAllActive ? animations.showAll.centered : animations.showAll.normal;

	// Event handlers
	const handleToggleShowAll = () => dispatch('toggleShowAll');
	const handleTabSelect = (event: CustomEvent<string>) => dispatch('tabSelect', event.detail); // Correctly dispatch detail
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} data-testid="option-picker-header">
	<div class="header-controls" class:centered-mode={showAllActive}>
		<Motion
			layout
			animate={showAllAnimate}
			transition={animations.transition}
			initial={false}
			let:motion
		>
			<div class="show-all-container" use:motion>
				<ShowAllButton {showAllActive} on:toggle={handleToggleShowAll} />
			</div>
		</Motion>

		<Motion
			layout
			animate={tabsAnimate}
			transition={animations.transition}
			initial={false}
			let:motion
		>
			<div class="tabs-container" use:motion>
				<HeaderControls
					{categoryKeys}
					{selectedTab}
					onTabSelect={(tab) => dispatch('tabSelect', tab)}
				/>
			</div>
		</Motion>

		<Motion
			layout
			animate={sortAnimate}
			transition={animations.transition}
			initial={false}
			let:motion
		>
			<div class="sort-container" use:motion>
				<SortOptions />
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
		.tabs-container {
			order: 2;
		}
		.sort-container {
			order: 3;
		}
		.show-all-container {
			order: 1;
		}
		.header-controls.centered-mode {
			flex-direction: column;
			justify-content: center;
		}
		.header-controls.centered-mode .show-all-container {
			width: 100%;
		}
	}
</style>
