// src/lib/utils/optionPickerLayoutUtils.ts

/**
 * Utility functions for calculating optimal layouts for the OptionPicker component
 * based on device type, orientation, and container dimensions.
 */

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
  ): string {
    // For mobile in portrait mode
    if (isMobile && isPortrait) {
      if (count <= 4) return 'repeat(2, 1fr)';
      if (count <= 8) return 'repeat(3, 1fr)';
      return 'repeat(4, 1fr)';
    }
    
    // For mobile in landscape
    if (isMobile && !isPortrait) {
      if (count <= 4) return 'repeat(4, 1fr)';
      if (count <= 12) return 'repeat(4, 1fr)';
      return 'repeat(6, 1fr)';
    }
    
    // For desktop in portrait mode
    if (!isMobile && isPortrait) {
      if (count <= 4) return 'repeat(2, 1fr)';
      if (count <= 8) return 'repeat(4, 1fr)';
      if (count <= 16) return 'repeat(4, 1fr)';
      return 'repeat(6, 1fr)';
    }
    
    // For desktop in landscape (default)
    if (count <= 4) return 'repeat(4, 1fr)';
    if (count <= 8) return 'repeat(4, 1fr)';
    if (count <= 12) return 'repeat(6, 1fr)';
    if (count <= 16) return 'repeat(8, 1fr)';
    if (count <= 24) return 'repeat(8, 1fr)';
    return 'repeat(auto-fill, minmax(80px, 1fr))';
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
   * @param isMobile Whether the device is mobile
   * @param isPortrait Whether the device is in portrait orientation
   */
  export function getOptionSize(
    count: number,
    containerHeight: number = 0,
    containerWidth: number = 0,
    isMobile: boolean = false,
    isPortrait: boolean = false
  ): string {
    if (!containerHeight || !containerWidth) return 'auto';
  
    // Scale factors
    const scaleFactor = isMobile ? 0.9 : 1.0;
    
    // Mobile portrait mode (smallest screens)
    if (isMobile && isPortrait) {
      const availableWidth = containerWidth - 30; // Less padding on mobile
      const columnsCount = count <= 4 ? 2 : count <= 8 ? 3 : 4;
      const size = Math.floor((availableWidth / columnsCount) * scaleFactor) - 10;
      return `${Math.max(60, Math.min(100, size))}px`;
    }
    
    // Mobile landscape
    if (isMobile && !isPortrait) {
      const availableHeight = containerHeight - 40;
      const rowCount = count <= 8 ? 2 : 3;
      const itemHeight = Math.floor((availableHeight / rowCount) * scaleFactor) - 10;
      return `${Math.max(60, Math.min(90, itemHeight))}px`;
    }
  
    // Special case for exactly 8 pictographs (4×2 grid) on desktop
    if (count === 8 && !isMobile) {
      // Calculate maximum size that fits both width and height constraints
      const availableHeight = containerHeight - 40; // Reduced padding for 8 items
      const availableWidth = containerWidth - 80; // Reduced container padding
  
      // For 8 items in 4×2 grid
      const maxHeightBasedOnContainer = Math.floor(availableHeight / 2); // 2 rows
      const maxWidthBasedOnContainer = Math.floor(availableWidth / 4); // 4 columns
  
      // Use the smaller of width or height to maintain square aspect ratio
      const size = Math.min(maxHeightBasedOnContainer, maxWidthBasedOnContainer);
  
      // Ensure reasonable minimum size
      return `${Math.max(100, size)}px`; // Increased minimum size
    }
  
    // For other small counts (1-7) on desktop
    if (count < 8 && !isMobile) {
      const availableHeight = containerHeight - 140;
      const rowCount = count <= 4 ? 1 : 2;
      const rowGap = 12;
      const itemHeight = Math.floor(availableHeight / rowCount - rowGap);
      return `${Math.max(80, itemHeight)}px`;
    }
  
    // For larger counts on desktop
    if (count <= 24 && !isMobile) {
      const availableHeight = containerHeight - 140;
      const rowCount = count <= 16 ? 2 : 3;
      const rowGap = 12;
      const itemHeight = Math.floor(availableHeight / rowCount - rowGap);
      if (itemHeight >= 60) {
        return `${itemHeight}px`;
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
    return {
      gridColumns: getOptimalGridColumns(count, isMobile, isPortrait),
      optionSize: getOptionSize(count, containerHeight, containerWidth, isMobile, isPortrait),
      gridGap: getGridGap(count, isMobile),
      gridClass: getGridClass(count, isMobile),
      scaleFactor: getPictographScaleFactor(isMobile)
    };
  }