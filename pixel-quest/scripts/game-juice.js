// ==================== JUICE SYSTEM ====================
class JuiceSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0, startTime: 0 };
  }
  
  shakeScreen(intensity = 5, duration = 100) {
    this.screenShake = {
      x: 0,
      y: 0,
      intensity,
      duration,
      startTime: Date.now()
    };
    
    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - this.screenShake.startTime;
      if (elapsed >= duration) {
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0, startTime: 0 };
        clearInterval(shakeInterval);
      } else {
        const power = intensity * (1 - elapsed / duration);
        this.screenShake.x = (Math.random() - 0.5) * power * 2;
        this.screenShake.y = (Math.random() - 0.5) * power * 2;
      }
    }, 16);
  }
  
  flashScreen(color = '#FFFFFF', duration = 100) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: ${color};
      pointer-events: none;
      opacity: 0.6;
      z-index: 9999;
      transition: opacity ${duration}ms ease-out;
    `;
    document.body.appendChild(flash);
    
    requestAnimationFrame(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), duration);
    });
  }
  
  createParticles(x, y, config = {}) {
    const defaults = {
      count: 10,
      colors: ['#FFF', '#FF0', '#F80'],
      velocity: { min: 2, max: 5 },
      lifetime: 1,
      gravity: 0.1,
      spread: 360,
      size: { min: 2, max: 6 }
    };
    
    const settings = { ...defaults, ...config };
    
    for (let i = 0; i < settings.count; i++) {
      const angle = (settings.spread / settings.count) * i + Math.random() * 20;
      const speed = settings.velocity.min + Math.random() * (settings.velocity.max - settings.velocity.min);
      
      this.particles.push({
        x, y,
        vx: Math.cos(angle * Math.PI / 180) * speed,
        vy: Math.sin(angle * Math.PI / 180) * speed,
        color: settings.colors[Math.floor(Math.random() * settings.colors.length)],
        size: settings.size.min + Math.random() * (settings.size.max - settings.size.min),
        lifetime: settings.lifetime,
        age: 0,
        gravity: settings.gravity
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.age += deltaTime;
      if (p.age >= p.lifetime) return false;
      
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;
      p.vy += p.gravity * deltaTime * 60;
      
      return true;
    });
  }
  
  renderParticles(ctx, offsetX = 0, offsetY = 0) {
    this.particles.forEach(p => {
      const alpha = 1 - (p.age / p.lifetime);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - offsetX, p.y - offsetY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  
  createFloatingText(x, y, text, config = {}) {
    const defaults = {
      color: '#FFF',
      fontSize: 24,
      duration: 1000,
      arc: true,
      yOffset: -50
    };
    
    const settings = { ...defaults, ...config };
    
    this.floatingTexts.push({
      x, y,
      text,
      ...settings,
      age: 0
    });
  }
  
  updateFloatingTexts(deltaTime) {
    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.age += deltaTime;
      if (ft.age >= ft.duration / 1000) return false;
      
      const progress = ft.age / (ft.duration / 1000);
      
      if (ft.arc) {
        ft.y = ft.y - ft.yOffset * (1 - progress);
        ft.x = ft.x + Math.sin(progress * Math.PI) * 10;
      } else {
        ft.y -= (ft.yOffset / ft.duration) * deltaTime * 1000;
      }
      
      return true;
    });
  }
  
  renderFloatingTexts(ctx, offsetX = 0, offsetY = 0) {
    this.floatingTexts.forEach(ft => {
      const progress = ft.age / (ft.duration / 1000);
      const alpha = 1 - progress;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x - offsetX, ft.y - offsetY);
      ctx.fillText(ft.text, ft.x - offsetX, ft.y - offsetY);
    });
    ctx.globalAlpha = 1;
  }
  
  collectItem(x, y, type) {
    this.createParticles(x, y, {
      count: type === 'star' ? 15 : 8,
      colors: type === 'star' ? ['#FFD700', '#FFA500'] : ['#FFD700', '#FFC107'],
      velocity: { min: 2, max: 5 },
      lifetime: 0.8
    });
    
    this.createFloatingText(x, y, type === 'star' ? '⭐' : '+1', {
      color: type === 'star' ? '#FFD700' : '#FFD700',
      fontSize: type === 'star' ? 32 : 24,
      duration: 800
    });
  }
  
  checkpointActivated(x, y) {
    this.shakeScreen(3, 150);
    this.flashScreen('#4CAF50', 100);
    this.createParticles(x, y, {
      count: 20,
      colors: ['#4CAF50', '#8BC34A'],
      velocity: { min: 3, max: 7 },
      lifetime: 1.0,
      spread: 360
    });
  }
  
  enemyDefeated(x, y) {
    this.shakeScreen(4, 120);
    this.createParticles(x, y, {
      count: 12,
      colors: ['#F44336', '#E91E63'],
      velocity: { min: 3, max: 6 },
      lifetime: 0.8
    });
  }
  
  levelComplete(x, y) {
    this.shakeScreen(5, 200);
    this.flashScreen('#FFD700', 300);
    
    setTimeout(() => {
      this.createParticles(x, y, {
        count: 30,
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        velocity: { min: 4, max: 8 },
        lifetime: 1.5,
        spread: 360
      });
    }, 100);
  }
  
  playerDeath(x, y) {
    this.shakeScreen(6, 200);
    this.createParticles(x, y, {
      count: 15,
      colors: ['#F44336', '#E91E63', '#9C27B0'],
      velocity: { min: 2, max: 6 },
      lifetime: 1.0
    });
  }
  
  update(deltaTime) {
    this.updateParticles(deltaTime);
    this.updateFloatingTexts(deltaTime);
  }
  
  render(ctx, offsetX = 0, offsetY = 0) {
    this.renderParticles(ctx, offsetX, offsetY);
    this.renderFloatingTexts(ctx, offsetX, offsetY);
  }
  
  getScreenShake() {
    return this.screenShake;
  }
}
