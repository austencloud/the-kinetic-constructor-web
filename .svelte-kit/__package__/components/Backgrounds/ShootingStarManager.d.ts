export default class ShootingStarManager {
    shootingStar: {
        x: number;
        y: number;
        dx: number;
        dy: number;
        size: number;
        speed: number;
        tail: {
            x: number;
            y: number;
            size: number;
        }[];
        prevX: number;
        prevY: number;
        tailLength: number;
        opacity: number;
        offScreen: boolean;
    } | null;
    timer: number;
    interval: number;
    constructor();
    private randomInt;
    private randomFloat;
    spawnShootingStar(width: number, height: number): void;
    animateShootingStar(width: number, height: number): void;
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
    manageShootingStar(width: number, height: number): void;
}
