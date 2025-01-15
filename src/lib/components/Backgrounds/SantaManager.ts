export default class SantaManager {
	santaImage: HTMLImageElement | null = null;
	imageLoaded: boolean = false;
	santa: {
		x: number;
		y: number;
		speed: number;
		active: boolean;
		direction: number;
		opacity: number;
	} = { x: 0, y: 0, speed: 0, active: false, direction: 1, opacity: 1 };
	santaTimer: number = 0;
	santaInterval = this.randomInt(1200, 1500);

	constructor() {
		// Defer image initialization
		if (typeof window !== 'undefined') {
			this.santaImage = new Image();
			this.santaImage.src = 'santa.png';
			this.santaImage.onload = () => (this.imageLoaded = true);
			this.santaImage.onerror = () => console.error('Failed to load Santa image');
		}
	}

	initialize(width: number, height: number) {
		this.santa = { x: -0.2, y: 0.2, speed: 0.001, active: false, direction: 1, opacity: 0.8 };
		this.santaTimer = 0;
		this.santaInterval = this.randomInt(200, 300);
	}

	randomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	animateSanta() {
		if (this.santa.active) {
			this.santa.x += this.santa.speed * this.santa.direction;
			if (
				(this.santa.direction === 1 && this.santa.x > 1.2) ||
				(this.santa.direction === -1 && this.santa.x < -0.2)
			) {
				this.santa.active = false;
				this.santaTimer = 0;
			}
		} else {
			this.santaTimer++;
			if (this.santaTimer >= this.santaInterval) {
				this.santa.active = true;
				this.santa.direction = Math.random() < 0.5 ? -1 : 1;
				this.santa.x = this.santa.direction === 1 ? -0.2 : 1.2;
				this.santa.y = Math.random() * 0.2 + 0.1;
				this.santa.speed = Math.random() * 0.001 + 0.001;
				this.santaInterval = this.randomInt(1200, 1500);
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
		if (!this.santa.active || !this.imageLoaded || !this.santaImage) return;

		const santaWidth = Math.max(50, Math.min(width * 0.05, 100));
		const scalingFactor = santaWidth / this.santaImage.width;
		const santaHeight = this.santaImage.height * scalingFactor;

		const x = this.santa.x * width;
		const y = this.santa.y * height;

		ctx.save();
		ctx.globalAlpha = this.santa.opacity;

		if (this.santa.direction === 1) {
			ctx.drawImage(this.santaImage, x, y, santaWidth, santaHeight);
		} else {
			ctx.translate(x + santaWidth, y);
			ctx.scale(-1, 1);
			ctx.drawImage(this.santaImage, 0, 0, santaWidth, santaHeight);
		}

		ctx.restore();
	}
}
