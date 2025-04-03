// src/lib/components/OptionPicker/optionPickerLayoutUtils.ts

/**
 * Utility functions for calculating optimal layouts for the OptionPicker component
 * based on device type, orientation, and container dimensions.
 */

/**
 * Interface for grid configuration
 */
export interface GridConfiguration {
  columns: number;
  rows: number;
  template: string;
}

/**
 * Get the optimal grid column configuration based on option count and device
 * @param count Number of options to display
 * @param isMobile Whether the device is mobile
 * @param isPortrait Whether the device is in portrait orientation
 */
export function getOptimalGridColumns(
  count: number, 
  isMobile: boolean, 
  isPortrait: boolean
): GridConfiguration {
  let columns: number;
  let rows: number;
  let template: string;
  
  // For mobile in portrait mode
  if (isMobile && isPortrait) {
    if (count <= 4) {
      columns = 2;
      rows = Math.ceil(count / columns);
      template = 'repeat(2, 1fr)';
    } else if (count <= 8) {
      columns = 3;
      rows = Math.ceil(count / columns);
      template = 'repeat(3, 1fr)';
    } else {
      columns = 4;
      rows = Math.ceil(count / columns);
      template = 'repeat(4, 1fr)';
    }
  }
  // For mobile in landscape
  else if (isMobile && !isPortrait) {
    if (count <= 4) {
      columns = 4;
      rows = 1;
      template = 'repeat(4, 1fr)';
    } else if (count <= 12) {
      columns = 4;
      rows = Math.ceil(count / columns);
      template = 'repeat(4, 1fr)';
    } else {
      columns = 6;
      rows = Math.ceil(count / columns);
      template = 'repeat(6, 1fr)';
    }
  }
  // For desktop in portrait mode
  else if (!isMobile && isPortrait) {
    if (count <= 4) {
      columns = 2;
      rows = Math.ceil(count / columns);
      template = 'repeat(2, 1fr)';
    } else if (count <= 8) {
      columns = 4;
      rows = Math.ceil(count / columns);
      template = 'repeat(4, 1fr)';
    } else if (count <= 16) {
      columns = 4;
      rows = Math.ceil(count / columns);
      template = 'repeat(4, 1fr)';
    } else {
      columns = 6;
      rows = Math.ceil(count / columns);
      template = 'repeat(6, 1fr)';
    }
  }
  // For desktop in landscape (default)
  else {
    if (count <= 4) {
      columns = 4;
      rows = 1;
      template = 'repeat(4, 1fr)';
    } else if (count <= 8) {
      // Changed to 2 columns for exactly 8 items
      columns = 2;
      rows = Math.ceil(count / columns);
      template = 'repeat(2, 1fr)';
    } else if (count <= 12) {
      columns = 6;
      rows = Math.ceil(count / columns);
      template = 'repeat(6, 1fr)';
    } else if (count <= 16) {
      columns = 8;
      rows = Math.ceil(count / columns);
      template = 'repeat(8, 1fr)';
    } else if (count <= 24) {
      columns = 8;
      rows = Math.ceil(count / columns);
      template = 'repeat(8, 1fr)';
    } else {
      columns = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / columns);
      template = 'repeat(auto-fill, minmax(80px, 1fr))';
    }
  }
  
  return { columns, rows, template };
}

/**
 * Get additional CSS class for the grid based on option count and device
 * @param count Number of options to display
 * @param isMobile Whether the device is mobile
 */
export function getGridClass(count: number, isMobile: boolean): string {
  if (count === 8 && !isMobile) return 'exactly-eight';
  if (count <= 8) return 'small-count';
  return '';
}

/**
 * Get appropriate grid gap based on option count and device
 * @param count Number of options to display
 * @param isMobile Whether the device is mobile
 */
export function getGridGap(count: number, isMobile: boolean): string {
  if (isMobile) return '0.4rem';
  if (count === 8) return '0.5rem';
  return '0.75rem';
}

/**
 * Calculate the optimal size for option items based on various parameters
 * @param count Number of options to display
 * @param containerHeight Container height in pixels
 * @param containerWidth Container width in pixels
 * @param gridConfig Grid configuration with columns and rows
 * @param isMobile Whether the device is mobile
 * @param isPortrait Whether the device is in portrait orientation
 */
export function getOptionSize(
  count: number,
  containerHeight: number = 0,
  containerWidth: number = 0,
  gridConfig: GridConfiguration,
  isMobile: boolean = false,
  isPortrait: boolean = false
): string {
  if (!containerHeight || !containerWidth) return 'auto';

  // Extract row and column counts from the grid configuration
  const { columns, rows } = gridConfig;

  // Container padding values - these should match the CSS padding in OptionPicker.svelte
  const containerPadding = {
    horizontal: isMobile ? 20 : 40, // 10px or 20px on each side 
    vertical: isMobile ? 20 : 40,   // 10px or 20px on top and bottom
    gridPadding: 10,                // .options-grid padding (0.5rem ≈ 10px)
    itemPadding: 2                  // .options-grid > div padding (0.1rem ≈ 2px)
  };
  
  // Grid gap value (already calculated as string, but we need pixel value for calculations)
  const gridGapValue = isMobile ? 8 : (count === 8 ? 10 : 15); // 0.4rem, 0.5rem, 0.75rem
  
  // Scale factors
  const scaleFactor = isMobile ? 0.9 : 1.0;
  
  // Mobile portrait mode (smallest screens)
  if (isMobile && isPortrait) {
    const availableWidth = containerWidth - containerPadding.horizontal - (containerPadding.gridPadding * 2);
    const columnGaps = gridGapValue * (columns - 1);
    const itemWidth = (availableWidth - columnGaps) / columns;
    const size = Math.floor(itemWidth * scaleFactor) - (containerPadding.itemPadding * 2);
    return `${Math.max(60, Math.min(100, size))}px`;
  }
  
  // Mobile landscape
  if (isMobile && !isPortrait) {
    const availableHeight = containerHeight - containerPadding.vertical - (containerPadding.gridPadding * 2);
    const rowGaps = gridGapValue * (rows - 1);
    const itemHeight = (availableHeight - rowGaps) / rows;
    const size = Math.floor(itemHeight * scaleFactor) - (containerPadding.itemPadding * 2);
    return `${Math.max(60, Math.min(90, size))}px`;
  }

  // Special case for exactly 8 pictographs (2 columns × 4 rows grid) on desktop
  if (count === 8 && !isMobile) {
    // Calculate maximum size that fits both width and height constraints
    const availableHeight = containerHeight - containerPadding.vertical - (containerPadding.gridPadding * 2);
    const availableWidth = containerWidth - containerPadding.horizontal - (containerPadding.gridPadding * 2);
    
    const rowGaps = gridGapValue * (rows - 1);
    const columnGaps = gridGapValue * (columns - 1);
    
    const maxHeightBasedOnContainer = (availableHeight - rowGaps) / rows - (containerPadding.itemPadding * 2);
    const maxWidthBasedOnContainer = (availableWidth - columnGaps) / columns - (containerPadding.itemPadding * 2);

    // Use the smaller of width or height to maintain square aspect ratio
    const size = Math.min(maxHeightBasedOnContainer, maxWidthBasedOnContainer);

    // Ensure reasonable minimum size
    return `${Math.max(100, Math.floor(size))}px`;
  }

  // For other small counts (1-7) on desktop
  if (count < 8 && !isMobile) {
    const availableHeight = containerHeight - containerPadding.vertical - (containerPadding.gridPadding * 2) - 140;
    const rowGaps = gridGapValue * (rows - 1);
    const itemHeight = (availableHeight - rowGaps) / rows - (containerPadding.itemPadding * 2);
    return `${Math.max(80, Math.floor(itemHeight))}px`;
  }

  // For larger counts on desktop
  if (count <= 24 && !isMobile) {
    const availableHeight = containerHeight - containerPadding.vertical - (containerPadding.gridPadding * 2) - 140;
    const rowGaps = gridGapValue * (rows - 1);
    const itemHeight = (availableHeight - rowGaps) / rows - (containerPadding.itemPadding * 2);
    if (itemHeight >= 60) {
      return `${Math.floor(itemHeight)}px`;
    }
  }

  return 'auto';
}

/**
 * Get the appropriate scale factor for pictograph containers
 * @param isMobile Whether the device is mobile
 */
export function getPictographScaleFactor(isMobile: boolean): number {
  return isMobile ? 0.95 : 1.0;
}

/**
 * Interface for responsive layout configuration
 */
export interface ResponsiveLayoutConfig {
  gridColumns: string;
  optionSize: string;
  gridGap: string;
  gridClass: string;
  scaleFactor: number;
}

/**
 * Get complete responsive layout configuration in one call
 * @param count Number of options to display
 * @param containerHeight Container height in pixels
 * @param containerWidth Container width in pixels
 * @param isMobile Whether the device is mobile
 * @param isPortrait Whether the device is in portrait orientation
 */
export function getResponsiveLayout(
  count: number,
  containerHeight: number = 0,
  containerWidth: number = 0,
  isMobile: boolean = false,
  isPortrait: boolean = false
): ResponsiveLayoutConfig {
  const gridConfig = getOptimalGridColumns(count, isMobile, isPortrait);
  
  return {
    gridColumns: gridConfig.template,
    optionSize: getOptionSize(count, containerHeight, containerWidth, gridConfig, isMobile, isPortrait),
    gridGap: getGridGap(count, isMobile),
    gridClass: getGridClass(count, isMobile),
    scaleFactor: getPictographScaleFactor(isMobile)
  };
}