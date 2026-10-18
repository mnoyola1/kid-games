// ==================== JUICE SYSTEM ====================
// Particles, floating text, screen shake, and flashes, all driven by the lab loop.

const EASE = {
  outQuad: t => t * (2 - t),
  outBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

class JuiceSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.flashColor = null;
    this.flashTime = 0;
    this.flashDuration = 0;
    this.freeze = 0;
  }

  shake(intensity = 6, duration = 0.2) {
    if (intensity >= this.shakeIntensity * (this.shakeTime / (this.shakeDuration || 1))) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
      this.shakeTime = duration;
    }
  }

  flash(color = '#ffffff', duration = 0.15) {
    this.flashColor = color;
    this.flashDuration = duration;
    this.flashTime = duration;
  }

  hitstop(seconds = 0.05) {
    this.freeze = Math.max(this.freeze, seconds);
  }

  burst(x, y, { count = 12, colors = ['#fde047', '#facc15', '#ffffff'], speed = [120, 320], life = [0.4, 0.9], size = [3, 7], gravity = 380, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed[0] + Math.random() * (speed[1] - speed[0]);
      const l = life[0] + Math.random() * (life[1] - life[0]);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: l, age: 0,
        size: size[0] + Math.random() * (size[1] - size[0]),
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity,
      });
    }
  }

  // Rising fizz bubbles out of the beaker.
  fizz(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x: x + (Math.random() - 0.5) * 34, y, vx: (Math.random() - 0.5) * 20, vy: -50 - Math.random() * 60, life: 0.7, age: 0, size: 2 + Math.random() * 3, color: 'rgba(224,242,254,0.85)', gravity: 0, ring: true });
    }
  }

  text(x, y, str, { color = '#fde047', size = 28, life = 0.9, rise = 70 } = {}) {
    this.texts.push({ x, y, str, color, size, life, age: 0, rise });
  }

  update(dt) {
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.flashTime > 0) this.flashTime = Math.max(0, this.flashTime - dt);
    this.particles = this.particles.filter(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      return p.age < p.life;
    });
    this.texts = this.texts.filter(t => {
      t.age += dt;
      return t.age < t.life;
    });
  }

  shakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const p = this.shakeIntensity * (this.shakeTime / this.shakeDuration);
    return { x: (Math.random() - 0.5) * 2 * p, y: (Math.random() - 0.5) * 2 * p };
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  renderTexts(ctx) {
    this.texts.forEach(t => {
      const k = t.age / t.life;
      const pop = k < 0.15 ? EASE.outBack(k / 0.15) : 1;
      ctx.save();
      ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.translate(t.x, t.y - EASE.outQuad(k) * t.rise);
      ctx.scale(pop, pop);
      ctx.font = `700 ${t.size}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(15,23,42,0.75)';
      ctx.strokeText(t.str, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    });
  }

  renderFlash(ctx, w, h) {
    if (this.flashTime <= 0 || !this.flashColor) return;
    ctx.globalAlpha = 0.45 * (this.flashTime / this.flashDuration);
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}
