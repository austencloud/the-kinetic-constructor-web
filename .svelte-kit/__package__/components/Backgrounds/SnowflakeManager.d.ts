export default class SnowflakeManager {
    snowflakes: Array<{
        x: number;
        y: number;
        speed: number;
        size: number;
        sway: number;
        opacity: number;
    }>;
    initialize(width: number, height: number, count: number): void;
    adjustPositions(widthChange: number, heightChange: number): void;
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
}
