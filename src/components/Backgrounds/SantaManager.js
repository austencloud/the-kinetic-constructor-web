class SantaManager {
  constructor() {
    this.santaImage = new Image();
    this.santaImage.src = "/images/santa.png"; // Public folder assets are served from the root
    this.imageLoaded = false;

    this.santaImage.onload = () => {
      console.log("Santa image loaded successfully.");
      this.imageLoaded = true;
    };

    this.santaImage.onerror = () => {
      console.error("Failed to load Santa image.");
    };
  }


  initialize(width, height) {
    this.santa = {
      x: -0.2, // Percentage of width
      y: 0.2, // Percentage of height
      speed: 0.003, // Percentage of width per frame
      active: false,
      direction: 1, // 1 for left to right, -1 for right to left
      opacity: 0.8,
    };

    this.santaTimer = 0; // Timer to control when Santa appears
    this.santaInterval = this.randomInt(200, 300); // Frames between appearances
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  animateSanta() {
    if (this.santa.active) {
      this.santa.x += this.santa.speed * this.santa.direction;

      // Check if Santa has moved off-screen
      if (
        (this.santa.direction === 1 && this.santa.x > 1.2) || // Offscreen right
        (this.santa.direction === -1 && this.santa.x < -0.2) // Offscreen left
      ) {
        this.santa.active = false;
        this.santaTimer = 0;
      }
    } else {
      this.santaTimer += 1;
      if (this.santaTimer >= this.santaInterval) {
        this.santa.active = true;
        this.santa.direction = Math.random() < 0.5 ? -1 : 1;
        this.santa.x = this.santa.direction === 1 ? -0.2 : 1.2;
        this.santa.y = Math.random() * 0.2 + 0.1;
        this.santa.speed = Math.random() * 0.002 + 0.003;
        this.santaInterval = this.randomInt(500, 1000);
      }
    }
  }

  draw(ctx, width, height) {
    if (!this.santa.active || !this.imageLoaded) {
      console.log("Santa Image Not Loaded Yet");
      return;
    }

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

    ctx.globalAlpha = 1.0;
  }
}

export default SantaManager;
