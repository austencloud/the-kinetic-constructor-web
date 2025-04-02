import { createSnowflakeSystem } from './SnowflakeSystem';
import { createShootingStarSystem } from './ShootingStarSystem';
import { createSantaSystem } from './SantaSystem';
import type { AnimationSystem, Snowflake, ShootingStarState, SantaState } from '../../types/types';

/**
 * Factory for creating animation systems
 * Centralizes system creation and provides a consistent interface
 */
export const createAnimationSystem = <T>(
	type: 'snowflake' | 'shootingStar' | 'santa'
): AnimationSystem<T> => {
	switch (type) {
		case 'snowflake':
			return createSnowflakeSystem() as unknown as AnimationSystem<T>;
		case 'shootingStar':
			return createShootingStarSystem() as unknown as AnimationSystem<T>;
		case 'santa':
			return createSantaSystem() as unknown as AnimationSystem<T>;
		default:
			throw new Error(`Unknown animation system type: ${type}`);
	}
};

/**
 * Creates all animation systems based on configuration
 * @param enableSeasonal Whether to include seasonal systems
 * @returns An object containing all animation systems
 */
export const createAnimationSystems = (enableSeasonal: boolean = true) => {
	return {
		snowflake: createSnowflakeSystem(),
		shootingStar: createShootingStarSystem(),
		...(enableSeasonal ? { santa: createSantaSystem() } : {})
	};
};
