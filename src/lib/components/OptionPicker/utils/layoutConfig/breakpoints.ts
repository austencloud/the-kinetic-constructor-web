// src/lib/components/OptionPicker/utils/layoutConfig/breakpoints.ts

/**
 * Responsive breakpoints for different device sizes
 * These values help determine device type and layout strategies
 */
export const BREAKPOINTS = {
    // Smallest mobile devices (e.g., iPhone SE)
    smallMobile: 375,
    
    // Standard mobile devices
    mobile: 480,
    
    // Tablets and smaller laptops
    tablet: 768,
    
    // Standard laptops
    laptop: 1024,
    
    // Desktop screens
    desktop: 1280,
    
    // Large desktop screens
    largeDesktop: 1600,
    
    // Extra large screens
    extraLargeDesktop: 1920
};

// Aspect ratio thresholds for determining container shape
export const ASPECT_RATIO_THRESHOLDS = {
    tall: 0.8,    // Height is much greater than width
    square: 1.3,  // Roughly square or close to square
    wide: 2.0     // Width is significantly greater than height
};