// src/lib/components/OptionPicker/utils/layoutConfig/deviceConfigs.ts

// Configuration for different device types
export const DEVICE_CONFIG = {
    smallMobile: {
        padding: { horizontal: 8, vertical: 8 },
        gap: 2,
        minItemSize: 60,
        maxItemSize: 90,
        baseSize: (containerWidth: number, count: number) => {
            // Smaller devices adjust more aggressively
            if (count <= 4) return Math.min(containerWidth / 4, 120);
            if (count <= 16) return Math.min(containerWidth / 3, 100);
            return Math.min(containerWidth / 3, 80);
        },
        scaleFactor: 0.95
    },
    mobile: {
        padding: { horizontal: 12, vertical: 12 },
        gap: 20,
        minItemSize: 80,
        maxItemSize: 175,
        baseSize: (containerWidth: number, count: number) => {
            if (count <= 16) return Math.min(containerWidth / 4, 150);
            return Math.min(containerWidth / 4, 120);
        },
        scaleFactor: 1
    },
    tablet: {
        padding: { horizontal: 16, vertical: 16 },
        gap: 2,
        minItemSize: 80,
        maxItemSize: 175,
        baseSize: (containerWidth: number, count: number) => {
            // Balanced approach for tablets
            if (count === 1) return Math.min(containerWidth * 0.6, 300);
            if (count === 2) return Math.min(containerWidth / 2.2, 250);
            if (count <= 6) return Math.min(containerWidth / 3, 200);
            if (count <= 16) return Math.min(containerWidth / 4, 220);
            return Math.min(containerWidth / 4, 160);
        },
        scaleFactor: 1
    },
    desktop: {
        padding: { horizontal: 20, vertical: 20 },
        gap: 2,
        minItemSize: 90,
        maxItemSize: 180,
        baseSize: (containerWidth: number, count: number) => {
            // Sophisticated sizing for desktop
            if (count === 1) return Math.min(containerWidth * 0.5, 400);
            
            // Special handling for exactly 16 items
            if (count === 16) {
                // Wide screens get larger items
                if (containerWidth > 1600) {
                    return Math.min(containerWidth / 4.5, 360);
                }
                // Standard wide screens
                if (containerWidth > 1200) {
                    return Math.min(containerWidth / 5, 300);
                }
                return Math.min(containerWidth / 5, 250);
            }

            // General scaling strategy
            if (count === 2) return Math.min(containerWidth / 2.2, 300);
            if (count <= 6) return Math.min(containerWidth / 3, 250);
            if (count <= 12) return Math.min(containerWidth / 4, 220);
            return Math.min(containerWidth / 4, 200);
        },
        scaleFactor: 1.0
    },
    largeDesktop: {
        padding: { horizontal: 24, vertical: 24 },
        gap: 20,
        minItemSize: 100,
        maxItemSize: 200,
        baseSize: (containerWidth: number, count: number) => {
            // Most expansive sizing for large screens
            if (count === 1) return Math.min(containerWidth * 0.4, 500);
            if (count === 2) return Math.min(containerWidth / 2, 400);
            if (count === 16) {
                // Ultra-wide screens get very large items
                if (containerWidth > 2000) {
                    return Math.min(containerWidth / 4, 450);
                }
                return Math.min(containerWidth / 4.5, 400);
            }
            if (count <= 6) return Math.min(containerWidth / 3, 300);
            if (count <= 12) return Math.min(containerWidth / 4, 280);
            return Math.min(containerWidth / 4, 250);
        },
        scaleFactor: 1.1
    }
};