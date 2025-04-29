import type {
    BackgroundSystem,
    Dimensions,
    QualityLevel,
    ShootingStarState,
    Star,
    CelestialBody,
    Spaceship,
    EasterEggState,
    AccessibilitySettings
} from '../types/types';
import { drawBackgroundGradient } from '../snowfall/utils/backgroundUtils';
import { getOptimizedConfig } from '../config';
import { createShootingStarSystem } from '../systems/ShootingStarSystem';

export class NightSkyBackgroundSystem implements BackgroundSystem {
    private quality: QualityLevel = 'medium';
    private stars: Star[] = [];
    private shootingStarSystem = createShootingStarSystem();
    private shootingStarState: ShootingStarState;
    private celestialBody: CelestialBody | null = null;
    private spaceshipState: EasterEggState<Spaceship>;

    private nightSkyConfig = getOptimizedConfig(this.quality).config.nightSky;
    private coreQualitySettings = getOptimizedConfig(this.quality).qualitySettings;

    private accessibility: AccessibilitySettings = {
        reducedMotion: false, highContrast: false, visibleParticleSize: 2
    };

    constructor() {
        this.shootingStarState = this.shootingStarSystem.initialState;
        this.spaceshipState = {
            element: null,
            timer: 0,
            interval: this.getRandomSpaceshipInterval()
        };
    }

    public initialize(dimensions: Dimensions, quality: QualityLevel): void {
        this.setQuality(quality);
        this.stars = this.initializeStars(dimensions);
        this.celestialBody = this.initializeCelestialBody(dimensions);
        this.shootingStarState = this.shootingStarSystem.initialState;
        this.spaceshipState = {
            element: null,
            timer: 0,
            interval: this.getRandomSpaceshipInterval()
        };
    }

    private initializeStars(dimensions: Dimensions): Star[] {
        const { config, qualitySettings } = getOptimizedConfig(this.quality);
        const starConfig = config.nightSky.stars;
        const density = starConfig.density * qualitySettings.densityMultiplier;
        const count = Math.floor(dimensions.width * dimensions.height * density);
        const stars: Star[] = [];

        for (let i = 0; i < count; i++) {
            const radius = this.randomFloat(starConfig.minSize, starConfig.maxSize);
            const isTwinkling = Math.random() < starConfig.twinkleChance;
            const baseOpacity = this.randomFloat(starConfig.baseOpacityMin, starConfig.baseOpacityMax);
            stars.push({
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                radius: radius,
                baseOpacity: baseOpacity,
                currentOpacity: baseOpacity,
                twinkleSpeed: isTwinkling ? this.randomFloat(starConfig.minTwinkleSpeed, starConfig.maxTwinkleSpeed) : 0,
                twinklePhase: Math.random() * Math.PI * 2,
                isTwinkling: isTwinkling,
                color: starConfig.colors[Math.floor(Math.random() * starConfig.colors.length)]
            });
        }
        return stars;
    }

    private initializeCelestialBody(dimensions: Dimensions): CelestialBody | null {
         const { config, qualitySettings } = getOptimizedConfig(this.quality);
         const bodyConfig = config.nightSky.celestialBody;

         if (!bodyConfig.enabledOnQuality.includes(this.quality)) {
             return null;
         }

         const baseSize = Math.min(dimensions.width, dimensions.height);
         const radius = Math.min(baseSize * bodyConfig.radiusPercent, bodyConfig.maxRadiusPx);
         const driftSpeed = this.accessibility.reducedMotion ? bodyConfig.driftSpeed * 0.1 : bodyConfig.driftSpeed;

         return {
             x: dimensions.width * bodyConfig.position.x,
             y: dimensions.height * bodyConfig.position.y,
             radius: radius,
             color: bodyConfig.color,
             driftX: (Math.random() - 0.5) * driftSpeed * dimensions.width,
             driftY: (Math.random() - 0.5) * driftSpeed * dimensions.height
         };
    }


    public update(dimensions: Dimensions): void {
        this.updateStars();
        this.updateCelestialBody(dimensions);

        const { qualitySettings } = getOptimizedConfig(this.quality);
        if (qualitySettings.enableShootingStars && this.nightSkyConfig.shootingStar.enabledOnQuality.includes(this.quality)) {
             this.shootingStarState = this.shootingStarSystem.update(this.shootingStarState, dimensions);
        }
        if (this.nightSkyConfig.spaceship.enabledOnQuality.includes(this.quality)) {
            this.updateSpaceship(dimensions);
        }
    }

    private updateStars(): void {
        const now = performance.now() * 0.01;
        this.stars.forEach(star => {
            if (star.isTwinkling) {
                star.currentOpacity = star.baseOpacity * (0.7 + 0.3 * Math.sin(star.twinklePhase + now * star.twinkleSpeed));
            }
        });
    }

     private updateCelestialBody(dimensions: Dimensions): void {
        if (!this.celestialBody || !this.celestialBody.driftX || !this.celestialBody.driftY) return;

        this.celestialBody.x += this.celestialBody.driftX;
        this.celestialBody.y += this.celestialBody.driftY;

        const radius = this.celestialBody.radius;
        if (this.celestialBody.x < -radius) this.celestialBody.x = dimensions.width + radius;
        if (this.celestialBody.x > dimensions.width + radius) this.celestialBody.x = -radius;
        if (this.celestialBody.y < -radius) this.celestialBody.y = dimensions.height + radius;
        if (this.celestialBody.y > dimensions.height + radius) this.celestialBody.y = -radius;
    }

    private updateSpaceship(dimensions: Dimensions): void {
        const { config } = getOptimizedConfig(this.quality);
        const spaceshipConfig = config.nightSky.spaceship;

        if (!this.spaceshipState.element?.active) {
            this.spaceshipState.timer++;
            if (this.spaceshipState.timer >= this.spaceshipState.interval) {
                this.spaceshipState.element = this.spawnSpaceship(dimensions);
                this.spaceshipState.timer = 0;
                 if(!this.spaceshipState.element) {
                     this.spaceshipState.interval = this.getRandomSpaceshipInterval();
                 }
            }
        } else {
            const ship = this.spaceshipState.element;
            ship.x += ship.speed * ship.direction;

            const offScreenLeft = ship.x > dimensions.width + ship.width;
            const offScreenRight = ship.x < -ship.width;

            if (offScreenLeft || offScreenRight) {
                this.spaceshipState.element = null;
                this.spaceshipState.interval = this.getRandomSpaceshipInterval();
            }
        }
    }

     private spawnSpaceship(dimensions: Dimensions): Spaceship | null {
        const { config } = getOptimizedConfig(this.quality);
        const spaceshipConfig = config.nightSky.spaceship;

        const direction = Math.random() > 0.5 ? 1 : -1;
        const width = Math.min(dimensions.width * spaceshipConfig.widthPercent, spaceshipConfig.maxWidthPx);
        const height = width / spaceshipConfig.aspectRatio;
        const startY = Math.random() * (dimensions.height * 0.6) + (dimensions.height * 0.1);
        const startX = direction === 1 ? -width : dimensions.width;
        const speed = dimensions.width * spaceshipConfig.speedPercent * (this.accessibility.reducedMotion ? 0.3 : 1);


        return {
            x: startX,
            y: startY,
            width: width,
            height: height,
            speed: speed,
            active: true,
            direction: direction,
            opacity: spaceshipConfig.opacity,
        };
    }

    private getRandomSpaceshipInterval(): number {
         const { config } = getOptimizedConfig(this.quality);
         const spaceshipConfig = config.nightSky.spaceship;
         const intervalInFrames = Math.floor(Math.random() * (spaceshipConfig.maxInterval - spaceshipConfig.minInterval + 1)) + spaceshipConfig.minInterval;
         return intervalInFrames;
    }


    public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
        const { config } = getOptimizedConfig(this.quality);

        drawBackgroundGradient(ctx, dimensions, config.nightSky.background.gradientStops);

        this.drawCelestialBody(ctx);

        this.drawStars(ctx);

        if (this.nightSkyConfig.shootingStar.enabledOnQuality.includes(this.quality)) {
            this.shootingStarSystem.draw(this.shootingStarState, ctx);
        }

         if (this.nightSkyConfig.spaceship.enabledOnQuality.includes(this.quality)) {
            this.drawSpaceship(ctx);
        }
    }

    private drawStars(ctx: CanvasRenderingContext2D): void {
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = star.currentOpacity;
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    private drawCelestialBody(ctx: CanvasRenderingContext2D): void {
        if (!this.celestialBody) return;

         ctx.beginPath();
         ctx.arc(this.celestialBody.x, this.celestialBody.y, this.celestialBody.radius, 0, Math.PI * 2);
         ctx.fillStyle = this.celestialBody.color;
         ctx.shadowColor = this.celestialBody.color;
         ctx.shadowBlur = this.celestialBody.radius * 0.5;
         ctx.fill();
         ctx.shadowColor = 'transparent';
         ctx.shadowBlur = 0;
    }

     private drawSpaceship(ctx: CanvasRenderingContext2D): void {
        if (!this.spaceshipState.element?.active) return;
        const ship = this.spaceshipState.element;

         ctx.fillStyle = '#cccccc';
         ctx.globalAlpha = ship.opacity;
         ctx.beginPath();
         if (ship.direction > 0) {
             ctx.moveTo(ship.x, ship.y);
             ctx.lineTo(ship.x + ship.width, ship.y + ship.height / 2);
             ctx.lineTo(ship.x, ship.y + ship.height);
         } else {
              ctx.moveTo(ship.x + ship.width, ship.y);
              ctx.lineTo(ship.x, ship.y + ship.height / 2);
              ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
         }
         ctx.closePath();
         ctx.fill();
         ctx.globalAlpha = 1.0;
    }

    public setQuality(quality: QualityLevel): void {
        if (this.quality === quality) return;
        console.log(`NightSky: Setting quality to ${quality}`);
        this.quality = quality;
        this.nightSkyConfig = getOptimizedConfig(this.quality).config.nightSky;
        this.coreQualitySettings = getOptimizedConfig(this.quality).qualitySettings;
    }

    public setAccessibility(settings: AccessibilitySettings): void {
        this.accessibility = settings;
         this.nightSkyConfig = getOptimizedConfig(this.quality).config.nightSky;
    }

    public handleResize(oldDimensions: Dimensions, newDimensions: Dimensions): void {
        this.stars = this.adjustStarsToResize(this.stars, oldDimensions, newDimensions);
        this.celestialBody = this.adjustCelestialBodyToResize(this.celestialBody, oldDimensions, newDimensions);
        this.shootingStarState = this.shootingStarSystem.initialState;
        this.spaceshipState.element = null;
        this.spaceshipState.timer = 0;
        this.spaceshipState.interval = this.getRandomSpaceshipInterval();
    }

    private adjustStarsToResize(stars: Star[], oldDimensions: Dimensions, newDimensions: Dimensions): Star[] {
         const { config, qualitySettings } = getOptimizedConfig(this.quality);
         const starConfig = config.nightSky.stars;
         const density = starConfig.density * qualitySettings.densityMultiplier;
         const targetCount = Math.floor(newDimensions.width * newDimensions.height * density);
         const currentCount = stars.length;
         const widthRatio = newDimensions.width / oldDimensions.width;
         const heightRatio = newDimensions.height / oldDimensions.height;

         const adjustedStars = stars.map(star => ({
             ...star,
             x: star.x * widthRatio,
             y: star.y * heightRatio
         }));

         if (targetCount > currentCount) {
             for (let i = 0; i < targetCount - currentCount; i++) {
                 adjustedStars.push(this.createStar(newDimensions));
             }
         } else if (targetCount < currentCount) {
             adjustedStars.length = targetCount;
         }

         return adjustedStars;
    }

     private adjustCelestialBodyToResize(body: CelestialBody | null, oldDimensions: Dimensions, newDimensions: Dimensions): CelestialBody | null {
        if (!body) return null;
         const { config } = getOptimizedConfig(this.quality);
         const bodyConfig = config.nightSky.celestialBody;

         if (!bodyConfig.enabledOnQuality.includes(this.quality)) {
             return null;
         }

         const baseSize = Math.min(newDimensions.width, newDimensions.height);
         const radius = Math.min(baseSize * bodyConfig.radiusPercent, bodyConfig.maxRadiusPx);
         const driftSpeed = this.accessibility.reducedMotion ? bodyConfig.driftSpeed * 0.1 : bodyConfig.driftSpeed;

        const xRatio = body.x / oldDimensions.width;
        const yRatio = body.y / oldDimensions.height;

        return {
            ...body,
            x: newDimensions.width * xRatio,
            y: newDimensions.height * yRatio,
            radius: radius,
             driftX: (body.driftX && body.driftX > 0 ? 1 : -1) * driftSpeed * newDimensions.width * (Math.random()*0.4 + 0.8),
             driftY: (body.driftY && body.driftY > 0 ? 1 : -1) * driftSpeed * newDimensions.height * (Math.random()*0.4 + 0.8)
        };
    }

    private createStar(dimensions: Dimensions): Star {
        const { config } = getOptimizedConfig(this.quality);
        const starConfig = config.nightSky.stars;
        const radius = this.randomFloat(starConfig.minSize, starConfig.maxSize);
        const isTwinkling = Math.random() < starConfig.twinkleChance;
        const baseOpacity = this.randomFloat(starConfig.baseOpacityMin, starConfig.baseOpacityMax);
        return {
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            radius: radius,
            baseOpacity: baseOpacity,
            currentOpacity: baseOpacity,
            twinkleSpeed: isTwinkling ? this.randomFloat(starConfig.minTwinkleSpeed, starConfig.maxTwinkleSpeed) : 0,
            twinklePhase: Math.random() * Math.PI * 2,
            isTwinkling: isTwinkling,
            color: starConfig.colors[Math.floor(Math.random() * starConfig.colors.length)]
        };
    }

    private randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }


    public cleanup(): void {
        this.stars = [];
        this.celestialBody = null;
        this.shootingStarState = this.shootingStarSystem.initialState;
        this.spaceshipState = { element: null, timer: 0, interval: this.getRandomSpaceshipInterval() };
        console.log('NightSkyBackgroundSystem cleaned up.');
    }
}
