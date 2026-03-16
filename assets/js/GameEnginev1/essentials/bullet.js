class Bullet {
  constructor(gameEnv, x, y) {
    this.gameEnv = gameEnv;
    this.x = x;
    this.y = y;

    this.width = 4;   // thin bullet
    this.height = 16;

    this.speed = 10;
  }

  update() {
    // move upward
    this.y -= this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = "cyan";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  isOffscreen() {
    return this.y < -this.height;
  }
}

export default Bullet;