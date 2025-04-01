// src/lib/components/Backgrounds/AnimationConfig.ts

/**
 * Configuration for all animation components
 * Centralizes animation parameters for easy configuration
 */
export const AnimationConfig = {
    // Performance thresholds
    performance: {
      // FPS below this threshold will reduce animations
      lowPerformanceThreshold: 40,
      // FPS below this threshold will disable some animations
      criticalPerformanceThreshold: 20
    },
    
    // Snowflake configuration
    snowflake: {
      // Number of snowflakes per pixel of screen area (density)
      density: 0.0001,
      // How often the wind changes direction (in frames)
      windChangeInterval: 200,
      // Min and max snowflake sizes
      minSize: 2,
      maxSize: 7,
      // Min and max speeds for vertical movement
      minSpeed: 1,
      maxSpeed: 3,
      // Colors array for snowflakes
      colors: ['#FFFFFF', '#E3F2FD', '#BBDEFB', '#90CAF9']
    },
    
    // Santa configuration
    santa: {
      // Initial timer settings
      minInterval: 1200,
      maxInterval: 1500,
      // Speed settings
      minSpeed: 0.001,
      maxSpeed: 0.002,
      // Vertical position range
      minY: 0.1,
      maxY: 0.3,
      // Opacity
      opacity: 0.8,
      // Size as percentage of screen width
      maxSizePercent: 0.05,
      maxSizePx: 100
    },
    
    // Shooting star configuration
    shootingStar: {
      // Initial timer settings
      minInterval: 1000,
      maxInterval: 1500,
      // Star properties
      minSize: 3, 
      maxSize: 5,
      // Speed settings
      minSpeed: 0.02,
      maxSpeed: 0.05,
      // Tail properties
      tailLength: {
        min: 10,
        max: 20
      },
      // Colors for shooting stars
      colors: ['#FFD700', '#FFFFFF', '#FFA500', '#00FFFF'],
      // Fade rate for offscreen stars (per frame)
      fadeRate: 0.02,
      // Chance of twinkling effect (0-1)
      twinkleChance: 0.5
    },
    
    // Background configuration
    background: {
      // Gradient colors
      gradientStops: [
        { position: 0, color: '#0b1d2a' },
        { position: 0.3, color: '#142030' },
        { position: 0.7, color: '#325078' },
        { position: 1, color: '#49708a' }
      ]
    },
    
    // Seasonal features
    seasonal: {
      // Whether to enable seasonal features like Santa
      enabled: true,
      // Functions to determine which seasons are active
      isChristmas: () => {
        const date = new Date();
        const month = date.getMonth();
        const day = date.getDate();
        // December or first week of January
        return (month === 11) || (month === 0 && day <= 7);
      }
    }
  };