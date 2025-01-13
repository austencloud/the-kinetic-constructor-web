// SnowflakeManager.ts
export default class SnowflakeManager {
    snowflakes = [];
    initialize(width, height, count) {
        this.snowflakes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 3 + 1,
            sway: Math.random() * 2 - 1,
            opacity: Math.random() * 0.5 + 0.5,
        }));
    }
    adjustPositions(widthChange, heightChange) {
        this.snowflakes.forEach(flake => {
            flake.x += widthChange * Math.random();
            flake.y += heightChange * Math.random();
        });
    }
    draw(ctx, width, height) {
        this.snowflakes.forEach(flake => {
            ctx.globalAlpha = flake.opacity;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            flake.x += flake.sway;
            flake.y += flake.speed;
            if (flake.y > height)
                flake.y = -flake.size;
            if (flake.x > width || flake.x < 0)
                flake.x = Math.random() * width;
        });
        ctx.globalAlpha = 1.0;
    }
}
