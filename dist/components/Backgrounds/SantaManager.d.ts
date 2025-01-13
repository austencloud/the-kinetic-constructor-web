export default class SantaManager {
    santaImage: HTMLImageElement | null;
    imageLoaded: boolean;
    santa: {
        x: number;
        y: number;
        speed: number;
        active: boolean;
        direction: number;
        opacity: number;
    };
    santaTimer: number;
    santaInterval: number;
    constructor();
    initialize(width: number, height: number): void;
    randomInt(min: number, max: number): number;
    animateSanta(): void;
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}
