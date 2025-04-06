// src/lib/components/OptionPicker/utils/layoutConfig/configValidator.ts
import { LayoutConfigLogger } from './configLogger';

export class LayoutConfigValidator {
    static validateDimensions(width: number, height: number): boolean {
        if (width <= 0 || height <= 0) {
            LayoutConfigLogger.warn('Invalid container dimensions', { width, height });
            return false;
        }
        
        // Add more sophisticated validation if needed
        if (width > 10000 || height > 10000) {
            LayoutConfigLogger.warn('Unusually large container dimensions', { width, height });
            return false;
        }

        return true;
    }

    static validateItemCount(count: number): boolean {
        if (count < 0) {
            LayoutConfigLogger.warn('Invalid item count', { count });
            return false;
        }

        // Add reasonable upper limit
        if (count > 100) {
            LayoutConfigLogger.warn('Unusually large number of items', { count });
            return false;
        }

        return true;
    }

    // Add more specific validation methods
    static validateDeviceType(deviceType: string): boolean {
        const validDeviceTypes = ['smallMobile', 'mobile', 'tablet', 'desktop'];
        if (!validDeviceTypes.includes(deviceType)) {
            LayoutConfigLogger.warn('Invalid device type', { deviceType });
            return false;
        }
        return true;
    }
}