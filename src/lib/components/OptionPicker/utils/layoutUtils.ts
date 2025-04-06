// src/lib/components/OptionPicker/utils/layoutUtils.ts
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import { 
  DEVICE_CONFIG, LAYOUT_TEMPLATES, GAP_ADJUSTMENTS,
  getContainerAspect, getDeviceType, getLayoutCategory
} from '../config';
import type { DeviceType, LayoutCategory, ContainerAspect, ResponsiveLayoutConfig } from '../config';

/**
 * Main function to get responsive layout configuration
 */
export const getResponsiveLayout = memoizeLRU(
  (
    count: number,
    containerHeight: number = 0,
    containerWidth: number = 0,
    isMobileDevice: boolean = false,
    isPortraitMode: boolean = false
  ): ResponsiveLayoutConfig => {
    // Fallback for invalid dimensions
    if (containerHeight <= 0 || containerWidth <= 0) {
      console.warn('getResponsiveLayout called with invalid dimensions.');
      return {
        gridColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        optionSize: isMobileDevice ? '80px' : '100px',
        gridGap: '8px',
        gridClass: '',
        aspectClass: '',
        scaleFactor: isMobileDevice ? 0.95 : 1.0
      };
    }

    // Calculate grid configuration
    const gridConfig = calculateGridConfiguration(
      count,
      containerWidth,
      containerHeight,
      isMobileDevice,
      isPortraitMode
    );

    // Calculate item size
    const optionSize = calculateItemSize({
      count,
      containerWidth,
      containerHeight,
      gridConfig,
      isMobileDevice,
      isPortraitMode
    });

    // Get container aspect
    const containerAspect = getContainerAspect(containerWidth, containerHeight);

    // Get grid gap
    let gridGap = getGridGap(count, containerWidth, isMobileDevice);
    if (count === 16 && containerAspect === 'wide' && isPortraitMode) {
      gridGap = '10px';
    }

    // Get grid classes
    const { gridClass, aspectClass } = getGridClasses(
      count,
      containerWidth,
      containerHeight,
      isPortraitMode
    );

    // Get scale factor for the pictograph itself
    const deviceType = getDeviceType(containerWidth, isMobileDevice);
    const deviceConfig = DEVICE_CONFIG[deviceType];
    const scaleFactor = deviceConfig.scaleFactor;

    // Return the complete layout configuration
    return {
      gridColumns: gridConfig.template,
      optionSize,
      gridGap,
      gridClass,
      aspectClass,
      scaleFactor
    };
  },
  100,
  (count, containerHeight, containerWidth, isMobileDevice, isPortraitMode) =>
    `${count}:${Math.round(containerHeight || 0)}:${Math.round(containerWidth || 0)}:${isMobileDevice}:${isPortraitMode}`
);

/**
 * Calculates the optimal grid configuration
 */
const calculateGridConfiguration = memoizeLRU(
  (
    count: number,
    containerWidth: number,
    containerHeight: number,
    isMobileDevice: boolean,
    isPortraitMode: boolean
  ) => {
    const layoutCategory = getLayoutCategory(count);
    const containerAspect = getContainerAspect(containerWidth, containerHeight);
    let columns = 0;

    // Handle special cases first
    if (layoutCategory === 'singleItem') {
      columns = 1;
    } else if (layoutCategory === 'twoItems') {
      // Determine layout based on container aspect and orientation
      const useVerticalLayout =
        containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);
      columns = useVerticalLayout
        ? LAYOUT_TEMPLATES.twoItems.vertical.cols
        : LAYOUT_TEMPLATES.twoItems.horizontal.cols;
    } else {
      // Grid layouts (3+ items)
      const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';
      columns = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].cols;

      // Apply contextual adjustments
      if (count === 8 && containerAspect === 'tall') {
        columns = 2;
      }
      
      if (count === 16 && !isMobileDevice) {
        columns = 4;
        if (containerAspect === 'tall' && containerHeight > containerWidth * 1.8) {
          columns = 2;
        }
        if (containerAspect === 'wide' && containerHeight < containerWidth * 0.5) {
          columns = 8;
        }
      }

      // Mobile adjustments
      if (isMobileDevice && containerWidth < 375) {
        columns = Math.min(columns, 2);
      }

      // Handle large item counts
      if (!isMobileDevice && count > 16) {
        columns = isPortraitMode ? Math.min(4, columns + 1) : Math.min(6, columns + 1);
      }

      // Handle very wide containers
      if (!isMobileDevice && !isPortraitMode && containerWidth > 1600) {
        columns = Math.min(8, columns + 1);
      }

      // Ensure minimum of 1 column
      columns = Math.max(1, columns);
    }

    // Calculate rows and template
    const rows = Math.ceil(count / columns);
    const template = `repeat(${columns}, minmax(0, 1fr))`;

    return { columns, rows, template };
  },
  100,
  (count, width, height, isMobile, isPortrait) =>
    `${count}:${Math.round(width)}:${Math.round(height)}:${isMobile}:${isPortrait}`
);

/**
 * Calculates the optimal size for pictograph items
 */
const calculateItemSize = memoizeLRU(
  (config: {
    count: number;
    containerWidth: number;
    containerHeight: number;
    gridConfig: { columns: number; rows: number; template: string };
    isMobileDevice: boolean;
    isPortraitMode: boolean;
  }): string => {
    const { count, containerWidth, containerHeight, gridConfig, isMobileDevice } = config;
    const { columns, rows } = gridConfig;

    // Basic validation
    if (containerWidth <= 0 || containerHeight <= 0 || columns <= 0 || rows <= 0) {
      console.warn('Invalid dimensions or grid config for item size calculation.');
      return isMobileDevice ? '80px' : '100px';
    }

    const deviceType = getDeviceType(containerWidth, isMobileDevice);
    const deviceConfig = DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

    // Calculate available space
    const horizontalPadding = deviceConfig.padding.horizontal * 2;
    const verticalPadding = deviceConfig.padding.vertical * 2;
    const gapSize = deviceConfig.gap;
    const totalHorizontalGap = Math.max(0, columns - 1) * gapSize;
    const totalVerticalGap = Math.max(0, rows - 1) * gapSize;
    const availableWidth = containerWidth - horizontalPadding - totalHorizontalGap;
    const availableHeight = containerHeight - verticalPadding - totalVerticalGap;

    // Calculate size per item
    const widthPerItem = availableWidth / columns;
    const heightPerItem = availableHeight / rows;

    // Use the smaller dimension to ensure square items fit
    let calculatedSize = Math.min(widthPerItem, heightPerItem);

    // Apply scaling factor
    calculatedSize *= deviceConfig.scaleFactor;

    // Clamp between min and max
    calculatedSize = Math.max(deviceConfig.minItemSize, calculatedSize);
    calculatedSize = Math.min(deviceConfig.maxItemSize, calculatedSize);

    return `${Math.floor(calculatedSize)}px`;
  },
  100,
  (config) =>
    `${config.count}:${Math.round(config.containerWidth)}:${Math.round(config.containerHeight)}:${config.gridConfig.columns}:${config.gridConfig.rows}:${config.isMobileDevice}`
);

/**
 * Gets the appropriate grid gap size
 */
function getGridGap(count: number, containerWidth: number, isMobileDevice: boolean): string {
  const layoutCategory = getLayoutCategory(count);
  const deviceType = getDeviceType(containerWidth, isMobileDevice);
  const deviceConfig = DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG] || DEVICE_CONFIG.desktop;

  // Apply custom gap adjustment based on layout category
  const gapSize = deviceConfig.gap + (GAP_ADJUSTMENTS[layoutCategory as keyof typeof GAP_ADJUSTMENTS] || 0);

  return `${gapSize}px`;
}

/**
 * Gets appropriate CSS classes for the grid based on layout
 */
function getGridClasses(
  count: number,
  containerWidth: number,
  containerHeight: number,
  isPortraitMode: boolean
): { gridClass: string; aspectClass: string } {
  const layoutCategory = getLayoutCategory(count);
  const containerAspect = getContainerAspect(containerWidth, containerHeight);
  
  let gridClass = '';

  // Determine base class from layout templates
  if (layoutCategory === 'singleItem') {
    gridClass = LAYOUT_TEMPLATES.singleItem.class;
  } else if (layoutCategory === 'twoItems') {
    const useVerticalLayout =
      containerAspect === 'tall' || (containerAspect === 'square' && isPortraitMode);
    gridClass = useVerticalLayout
      ? LAYOUT_TEMPLATES.twoItems.vertical.class
      : LAYOUT_TEMPLATES.twoItems.horizontal.class;
  } else {
    // Grid layouts (3+ items)
    const deviceOrientation = isPortraitMode ? 'portraitDevice' : 'landscapeDevice';
    gridClass = LAYOUT_TEMPLATES[layoutCategory][deviceOrientation].class;
  }

  // Add aspect-based class
  const aspectClass = `${containerAspect}-aspect-container`;

  return { gridClass, aspectClass };
}