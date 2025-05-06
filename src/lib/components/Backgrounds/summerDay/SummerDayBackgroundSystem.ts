import type {
    BackgroundSystem,
    Dimensions,
    QualityLevel,
    Cloud,
    Sun,
    Bird,
    Butterfly,
    EasterEggState,
    AccessibilitySettings,
    ShootingStarState
} from '../types/types';
import { drawBackgroundGradient } from '../snowfall/utils/backgroundUtils';
import { getOptimizedConfig } from '../config';
import { createShootingStarSystem } from '../systems/ShootingStarSystem';

export class SummerDayBackgroundSystem implements BackgroundSystem {
    private quality: QualityLevel = 'medium';
    private clouds: Cloud[] = [];
    private sun: Sun | null = null;
    private birds: EasterEggState<Bird[]> = { element: null, timer: 0, interval: 15000 };
    private butterflies: EasterEggState<Butterfly[]> = { element: null, timer: 0, interval: 10000 };
    private shootingStarSystem = createShootingStarSystem();
    private shootingStarState: ShootingStarState;

    private summerConfig = getOptimizedConfig(this.quality).config.summerDay;
    private coreQualitySettings = getOptimizedConfig(this.quality).qualitySettings;

    private accessibility: AccessibilitySettings = {
        reducedMotion: false, 
        highContrast: false, 
        visibleParticleSize: 2
    };

    constructor() {
        this.shootingStarState = this.shootingStarSystem.initialState;
    }

    public initialize(dimensions: Dimensions, quality: QualityLevel): void {
        this.setQuality(quality);
        this.clouds = this.initializeClouds(dimensions);
        this.sun = this.initializeSun(dimensions);
        this.birds = {
            element: null,
            timer: 0,
            interval: this.getRandomInterval(
                this.summerConfig.birds.minInterval,
                this.summerConfig.birds.maxInterval
            )
        };
        this.butterflies = {
            element: null,
            timer: 0,
            interval: this.getRandomInterval(
                this.summerConfig.butterflies.minInterval,
                this.summerConfig.butterflies.maxInterval
            )
        };
        this.shootingStarState = this.shootingStarSystem.initialState;
    }

    private initializeClouds(dimensions: Dimensions): Cloud[] {
        const { config } = getOptimizedConfig(this.quality);
        const cloudConfig = config.summerDay.clouds;
        
        // Determine cloud count based on quality
        const cloudCount = cloudConfig.count[this.quality];
        const clouds: Cloud[] = [];

        for (let i = 0; i < cloudCount; i++) {
            clouds.push(this.createCloud(dimensions));
        }

        return clouds;
    }

    private createCloud(dimensions: Dimensions): Cloud {
        const { config } = getOptimizedConfig(this.quality);
        const cloudConfig = config.summerDay.clouds;
        
        const width = Math.random() * (cloudConfig.maxWidth - cloudConfig.minWidth) + cloudConfig.minWidth;
        const height = Math.random() * (cloudConfig.maxHeight - cloudConfig.minHeight) + cloudConfig.minHeight;
        const speed = Math.random() * (cloudConfig.speed.max - cloudConfig.speed.min) + cloudConfig.speed.min;
        const opacity = Math.random() * (cloudConfig.opacity.max - cloudConfig.opacity.min) + cloudConfig.opacity.min;
        
        return {
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height * 0.5, // Only in top half
            width,
            height,
            speed: this.accessibility.reducedMotion ? speed * 0.3 : speed,
            opacity,
            color: cloudConfig.color
        };
    }

    private initializeSun(dimensions: Dimensions): Sun {
        const { config } = getOptimizedConfig(this.quality);
        const sunConfig = config.summerDay.sun;
        
        const baseSize = Math.min(dimensions.width, dimensions.height);
        const radius = Math.min(baseSize * sunConfig.radiusPercent, sunConfig.maxRadiusPx);
        const driftSpeed = this.accessibility.reducedMotion ? 0.000001 : 0.00001;
        
        return {
            x: dimensions.width * sunConfig.position.x,
            y: dimensions.height * sunConfig.position.y,
            radius,
            color: sunConfig.color,
            glowColor: sunConfig.glowColor,
            glowSize: sunConfig.glowSize,
            driftX: (Math.random() - 0.5) * driftSpeed * dimensions.width,
            driftY: (Math.random() - 0.5) * driftSpeed * dimensions.height
        };
    }

    public update(dimensions: Dimensions): void {
        this.updateClouds(dimensions);
        this.updateSun(dimensions);
        this.updateBirds(dimensions);
        this.updateButterflies(dimensions);
        
        // Update shooting stars if enabled
        const { qualitySettings } = getOptimizedConfig(this.quality);
        if (qualitySettings.enableShootingStars) {
            this.shootingStarState = this.shootingStarSystem.update(this.shootingStarState, dimensions);
        }
    }

    private updateClouds(dimensions: Dimensions): void {
        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];
            cloud.x += cloud.speed;
            
            // If cloud moves off screen, reset it to the left
            if (cloud.x > dimensions.width + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * dimensions.height * 0.5;
            }
        }
    }

    private updateSun(dimensions: Dimensions): void {
        if (!this.sun) return;
        
        // Very subtle drift for the sun
        if (this.sun.driftX && this.sun.driftY) {
            this.sun.x += this.sun.driftX;
            this.sun.y += this.sun.driftY;
            
            // Keep sun within bounds
            if (this.sun.x < this.sun.radius || this.sun.x > dimensions.width - this.sun.radius) {
                this.sun.driftX = -this.sun.driftX;
            }
            if (this.sun.y < this.sun.radius || this.sun.y > dimensions.height * 0.5) {
                this.sun.driftY = -this.sun.driftY;
            }
        }
    }

    private updateBirds(dimensions: Dimensions): void {
        // Check if we should spawn birds
        if (!this.birds.element) {
            this.birds.timer += 16; // Assuming ~60fps
            if (this.birds.timer >= this.birds.interval) {
                this.birds.element = this.createBirdFlock(dimensions);
                this.birds.timer = 0;
            }
        } else {
            // Update existing birds
            const flock = this.birds.element;
            let allOffScreen = true;
            
            for (const bird of flock) {
                bird.x += bird.speed;
                bird.wingPhase += bird.wingSpeed;
                
                if (bird.x < dimensions.width + bird.size) {
                    allOffScreen = false;
                }
            }
            
            // If all birds are off screen, reset
            if (allOffScreen) {
                this.birds.element = null;
                this.birds.interval = this.getRandomInterval(
                    this.summerConfig.birds.minInterval,
                    this.summerConfig.birds.maxInterval
                );
            }
        }
    }

    private updateButterflies(dimensions: Dimensions): void {
        // Similar to birds but with more random movement
        if (!this.butterflies.element) {
            this.butterflies.timer += 16; // Assuming ~60fps
            if (this.butterflies.timer >= this.butterflies.interval) {
                this.butterflies.element = this.createButterflies(dimensions);
                this.butterflies.timer = 0;
            }
        } else {
            // Update existing butterflies
            const butterflies = this.butterflies.element;
            let allOffScreen = true;
            
            for (const butterfly of butterflies) {
                // Sine wave path
                butterfly.x += butterfly.speed;
                butterfly.y += Math.sin(butterfly.x * 0.01) * butterfly.path * 0.5;
                butterfly.wingPhase += butterfly.wingSpeed;
                
                if (butterfly.x > -butterfly.size && 
                    butterfly.x < dimensions.width + butterfly.size &&
                    butterfly.y > -butterfly.size &&
                    butterfly.y < dimensions.height + butterfly.size) {
                    allOffScreen = false;
                }
            }
            
            // If all butterflies are off screen, reset
            if (allOffScreen) {
                this.butterflies.element = null;
                this.butterflies.interval = this.getRandomInterval(
                    this.summerConfig.butterflies.minInterval,
                    this.summerConfig.butterflies.maxInterval
                );
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
        const { config } = getOptimizedConfig(this.quality);
        
        // Draw background gradient
        drawBackgroundGradient(ctx, dimensions, config.summerDay.background.gradientStops);
        
        // Draw sun with glow
        this.drawSun(ctx);
        
        // Draw clouds
        this.drawClouds(ctx);
        
        // Draw birds if active
        if (this.birds.element && this.summerConfig.birds.enabledOnQuality.includes(this.quality)) {
            this.drawBirds(ctx);
        }
        
        // Draw butterflies if active
        if (this.butterflies.element && this.summerConfig.butterflies.enabledOnQuality.includes(this.quality)) {
            this.drawButterflies(ctx);
        }
        
        // Draw shooting stars if enabled
        const { qualitySettings } = getOptimizedConfig(this.quality);
        if (qualitySettings.enableShootingStars) {
            this.shootingStarSystem.draw(this.shootingStarState, ctx);
        }
    }

    private drawSun(ctx: CanvasRenderingContext2D): void {
        if (!this.sun) return;
        
        // Draw sun glow
        const glow = ctx.createRadialGradient(
            this.sun.x, this.sun.y, this.sun.radius * 0.5,
            this.sun.x, this.sun.y, this.sun.radius * this.sun.glowSize
        );
        glow.addColorStop(0, this.sun.color);
        glow.addColorStop(0.7, this.sun.glowColor);
        glow.addColorStop(1, 'rgba(255, 170, 51, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.sun.x, this.sun.y, this.sun.radius * this.sun.glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sun core
        ctx.fillStyle = this.sun.color;
        ctx.beginPath();
        ctx.arc(this.sun.x, this.sun.y, this.sun.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawClouds(ctx: CanvasRenderingContext2D): void {
        for (const cloud of this.clouds) {
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            
            // Draw cloud as a series of overlapping circles
            const centerX = cloud.x + cloud.width / 2;
            const centerY = cloud.y + cloud.height / 2;
            const radiusX = cloud.width / 2;
            const radiusY = cloud.height / 2;
            
            // Draw main cloud body
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw cloud puffs
            const puffCount = 5;
            for (let i = 0; i < puffCount; i++) {
                const angle = (i / puffCount) * Math.PI;
                const puffX = centerX + Math.cos(angle) * radiusX * 0.8;
                const puffY = centerY + Math.sin(angle) * radiusY * 0.5 - radiusY * 0.2;
                const puffSize = (radiusX + radiusY) / 4;
                
                ctx.beginPath();
                ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    private drawBirds(ctx: CanvasRenderingContext2D): void {
        if (!this.birds.element) return;
        
        for (const bird of this.birds.element) {
            ctx.fillStyle = bird.color;
            
            // Draw bird as a simple "M" shape with wings that move
            const wingY = Math.sin(bird.wingPhase) * bird.size * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(bird.x - bird.size, bird.y);
            ctx.lineTo(bird.x - bird.size/2, bird.y - wingY);
            ctx.lineTo(bird.x, bird.y);
            ctx.lineTo(bird.x + bird.size/2, bird.y - wingY);
            ctx.lineTo(bird.x + bird.size, bird.y);
            ctx.stroke();
        }
    }

    private drawButterflies(ctx: CanvasRenderingContext2D): void {
        if (!this.butterflies.element) return;
        
        for (const butterfly of this.butterflies.element) {
            ctx.fillStyle = butterfly.color;
            
            // Draw butterfly with flapping wings
            const wingY = Math.sin(butterfly.wingPhase) * butterfly.size;
            
            // Draw body
            ctx.beginPath();
            ctx.ellipse(
                butterfly.x, 
                butterfly.y, 
                butterfly.size * 0.2, 
                butterfly.size * 0.8, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Draw wings
            ctx.beginPath();
            ctx.ellipse(
                butterfly.x - butterfly.size * 0.5, 
                butterfly.y, 
                butterfly.size * 0.5, 
                butterfly.size * 0.8, 
                wingY, 0, Math.PI * 2
            );
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(
                butterfly.x + butterfly.size * 0.5, 
                butterfly.y, 
                butterfly.size * 0.5, 
                butterfly.size * 0.8, 
                -wingY, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    private createBirdFlock(dimensions: Dimensions): Bird[] {
        const { config } = getOptimizedConfig(this.quality);
        const birdConfig = config.summerDay.birds;
        
        const flockSize = Math.floor(
            Math.random() * 
            (birdConfig.flockSize.max - birdConfig.flockSize.min) + 
            birdConfig.flockSize.min
        );
        
        const flock: Bird[] = [];
        const baseY = Math.random() * dimensions.height * 0.4 + dimensions.height * 0.1;
        
        for (let i = 0; i < flockSize; i++) {
            const size = Math.random() * 
                (birdConfig.size.max - birdConfig.size.min) + 
                birdConfig.size.min;
                
            flock.push({
                x: -size * (i + 1) * 2,
                y: baseY + (Math.random() - 0.5) * 20,
                size,
                speed: birdConfig.speed * (this.accessibility.reducedMotion ? 0.3 : 1),
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.1 + Math.random() * 0.1,
                color: birdConfig.color
            });
        }
        
        return flock;
    }

    private createButterflies(dimensions: Dimensions): Butterfly[] {
        const { config } = getOptimizedConfig(this.quality);
        const butterflyConfig = config.summerDay.butterflies;
        
        const count = butterflyConfig.count[this.quality];
        const butterflies: Butterfly[] = [];
        
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 
                (butterflyConfig.size.max - butterflyConfig.size.min) + 
                butterflyConfig.size.min;
                
            const colorIndex = Math.floor(Math.random() * butterflyConfig.colors.length);
            
            butterflies.push({
                x: Math.random() * dimensions.width,
                y: dimensions.height + size,
                size,
                speed: butterflyConfig.speed * (Math.random() * 0.5 + 0.5) * 
                    (this.accessibility.reducedMotion ? 0.3 : 1),
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: butterflyConfig.flutterSpeed * (Math.random() * 0.5 + 0.75),
                color: butterflyConfig.colors[colorIndex],
                path: Math.random()
            });
        }
        
        return butterflies;
    }

    private getRandomInterval(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    public setQuality(quality: QualityLevel): void {
        this.quality = quality;
        this.summerConfig = getOptimizedConfig(quality).config.summerDay;
        this.coreQualitySettings = getOptimizedConfig(quality).qualitySettings;
    }

    public setAccessibility(settings: AccessibilitySettings): void {
        this.accessibility = settings;
    }

    public cleanup(): void {
        // Clean up any resources
        this.clouds = [];
        this.sun = null;
        this.birds.element = null;
        this.butterflies.element = null;
    }
}
