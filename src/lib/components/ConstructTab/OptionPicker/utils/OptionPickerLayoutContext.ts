import { derived, type Readable } from 'svelte/store';
import { getResponsiveLayout, getEnhancedDeviceType } from './layoutUtils';
import { getContainerAspect, BREAKPOINTS } from '../config';
import type { LayoutContextValue } from '../layoutContext';

/**
 * Create a derived store for layout context based on various inputs
 */
export function createLayoutContext(
	windowWidth: Readable<number>,
	windowHeight: Readable<number>,
	containerWidth: Readable<number>,
	containerHeight: Readable<number>,
	uiState: Readable<any>,
	filteredOptionsStore: Readable<any[]>,
	groupedOptionsStore: Readable<Record<string, any[]>>,
	selectedTab: Readable<string | null>
): Readable<LayoutContextValue> {
	return derived(
		[
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			uiState,
			filteredOptionsStore,
			groupedOptionsStore,
			selectedTab
		],
		([
			$windowWidth,
			$windowHeight,
			$containerWidth,
			$containerHeight,
			$ui,
			$filteredOptions,
			$groupedOptions,
			$selectedTab
		]) => {
			// 1. Get enhanced device info using container width (more reliable for component layout)
			const { deviceType: enhancedDeviceType, foldableInfo } = getEnhancedDeviceType(
				$containerWidth > 0 ? $containerWidth : $windowWidth,
				$windowWidth < BREAKPOINTS.tablet
			);

			// 2. Determine isMobile/isTablet BASED ON the final enhancedDeviceType
			const isMobile = enhancedDeviceType === 'smallMobile' || enhancedDeviceType === 'mobile';
			const isTablet = enhancedDeviceType === 'tablet';

			// 3. Determine portrait/aspect based on container dimensions
			const isPortrait = $containerHeight > $containerWidth;
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			// 4. Calculate the count of items currently being displayed for layout purposes
			const optionsCount =
				$selectedTab && $selectedTab !== 'all' && $groupedOptions && $groupedOptions[$selectedTab]
					? $groupedOptions[$selectedTab].length // Count for the specific selected tab
					: $filteredOptions.length; // Count for the 'all' view

			// 5. Get the responsive layout configuration, passing foldableInfo
			const currentLayoutConfig = getResponsiveLayout(
				optionsCount,
				$containerHeight,
				$containerWidth,
				isMobile,
				isPortrait,
				foldableInfo // Pass the full foldable info object
			);

			// 6. Return the complete context object
			return {
				deviceType: enhancedDeviceType,
				isMobile: isMobile,
				isTablet: isTablet,
				isPortrait: isPortrait,
				containerWidth: $containerWidth,
				containerHeight: $containerHeight,
				ht: $containerHeight, // Add missing 'ht' property
				containerAspect: currentContainerAspect,
				layoutConfig: currentLayoutConfig,
				foldableInfo: foldableInfo // IMPORTANT: Pass the full foldable info object
			};
		}
	);
}
