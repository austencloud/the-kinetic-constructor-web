<!--
  Modern Option Service Provider - Nuclear Rebuild
  Provides dependency injection for all OptionPicker services
  Uses Svelte 5 context system for service distribution
-->

<script lang="ts">
	import { setContext } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import {
		OPTION_SERVICE_KEY,
		START_POSITION_SERVICE_KEY,
		LAYOUT_SERVICE_KEY
	} from './serviceKeys';

	import { OptionService } from './OptionService.svelte';
	import { StartPositionService } from './StartPositionService.svelte';
	import { LayoutService } from './LayoutService.svelte';

	// Props
	interface Props {
		sequenceService: ISequenceService;
		children?: any;
	}

	const { sequenceService, children }: Props = $props();

	// Service configuration
	const serviceConfig = {
		option: {
			maxOptions: 1000,
			enableCaching: true,
			cacheTimeout: 300000, // 5 minutes
			autoFilter: true,
			defaultSort: { field: 'letter' as const, direction: 'asc' as const }
		},
		startPosition: {
			enableValidation: true,
			autoSync: true,
			enableCaching: true,
			cacheTimeout: 600000, // 10 minutes
			maxPositions: 500
		},
		layout: {
			enableResponsive: true,
			enablePerformanceOptimization: true,
			calculationThrottle: 16, // 60fps
			defaultBreakpoints: {
				xs: 480,
				sm: 768,
				md: 1024,
				lg: 1280,
				xl: 1536
			},
			defaultConstraints: {
				minCellSize: 80,
				maxCellSize: 200,
				minColumns: 2,
				maxColumns: 8,
				preferredAspectRatio: 1.0,
				containerPadding: 16
			}
		}
	};

	// Create service instances
	const optionService = new OptionService(serviceConfig.option);
	const startPositionService = new StartPositionService(serviceConfig.startPosition);
	const layoutService = new LayoutService(serviceConfig.layout);

	// Set up service integrations
	$effect(() => {
		// Integrate StartPositionService with SequenceService
		startPositionService.syncWithSequenceService(sequenceService);

		// Set up cross-service communication
		const unsubscribePositionSelected = startPositionService.on(
			'position:selected',
			async (data) => {
				try {
					// When a start position is selected, load options for it
					await optionService.loadOptionsForPosition(data.position);
				} catch (error) {
					console.error('ModernOptionServiceProvider: Error loading options for position:', error);
				}
			}
		);

		const unsubscribePositionCleared = startPositionService.on('position:cleared', () => {
			// When start position is cleared, clear options
			optionService.clearOptions();
		});

		const unsubscribeOptionSelected = optionService.on('option:selected', (data) => {
			// When an option is selected, create a beat in the sequence
			try {
				// This would typically be handled by the container component
				// but we can emit an event for the container to handle
				console.log('ModernOptionServiceProvider: Option selected:', data.option.letter);
			} catch (error) {
				console.error('ModernOptionServiceProvider: Error handling option selection:', error);
			}
		});

		// Cleanup function
		return () => {
			unsubscribePositionSelected();
			unsubscribePositionCleared();
			unsubscribeOptionSelected();
		};
	});

	// Set up layout service with option count updates
	$effect(() => {
		const optionCount = optionService.optionCount;
		layoutService.setItemCount(optionCount);
	});

	// Provide services through context
	setContext(OPTION_SERVICE_KEY, optionService);
	setContext(START_POSITION_SERVICE_KEY, startPositionService);
	setContext(LAYOUT_SERVICE_KEY, layoutService);

	// Export services for direct access if needed
	export { optionService, startPositionService, layoutService };
</script>

<!-- Service provider wrapper -->
<div class="modern-option-service-provider">
	{@render children?.()}
</div>

<style>
	.modern-option-service-provider {
		/* Container for service-provided components */
		width: 100%;
		height: 100%;
	}
</style>
