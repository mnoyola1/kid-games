/**
 * Cipher Heist - Juice Layer
 *
 * Lightweight DOM-based effects: particle pool, screen shake, floating text,
 * and tap ripples. Wired into the React tree by importing CipherJuice and
 * calling helpers from event handlers.
 *
 * No heavy dependencies — every effect is a positioned DOM node that
 * self-removes after its CSS animation completes.
 */

(function (global) {
  const layer = () => {
    let el = document.getElementById('juice-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'juice-layer';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;';
      document.body.appendChild(el);
    }
    return el;
  };

  // ---------- Screen shake ----------

  let shakeTimer = null;
  function screenShake(intensity = 'normal') {
    const target = document.getElementById('root');
    if (!target) return;
    target.classList.remove('shake');
    // Force reflow so the animation re-fires
    void target.offsetWidth;
    target.classList.add('shake');
    if (shakeTimer) clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => target.classList.remove('shake'), 220);
  }

  // ---------- Particles ----------

  function spawnParticles({ x, y, count = 12, color = '#fbbf24', speed = 200, lifeMs = 900, size = 6 }) {
    const root = layer();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'juice-particle';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = speed + Math.random() * 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      p.style.cssText = `
        left:${x}px;top:${y}px;
        width:${size}px;height:${size}px;
        background:${color};
        box-shadow:0 0 8px ${color};
        transform:translate(0,0);
        transition:transform ${lifeMs}ms cubic-bezier(.2,.7,.4,1), opacity ${lifeMs}ms ease-out;
      `;
      root.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`;
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), lifeMs + 50);
    }
  }

  function spawnConfetti(centerX = window.innerWidth / 2, centerY = window.innerHeight / 3) {
    const colors = ['#fbbf24', '#22d3ee', '#a78bfa', '#f472b6', '#4ade80'];
    for (let i = 0; i < 60; i++) {
      const c = colors[i % colors.length];
      spawnParticles({
        x: centerX + (Math.random() - 0.5) * 80,
        y: centerY + (Math.random() - 0.5) * 40,
        count: 1,
        color: c,
        speed: 250 + Math.random() * 250,
        lifeMs: 1400 + Math.random() * 600,
        size: 6 + Math.random() * 4,
      });
    }
  }

  // ---------- Floating text ----------

  function floatText({ text, x, y, color = '#fbbf24', duration = 1100 }) {
    const root = layer();
    const node = document.createElement('div');
    node.className = 'floating-text';
    node.textContent = text;
    node.style.cssText = `
      left:${x}px;top:${y}px;color:${color};
      animation-duration:${duration}ms;
    `;
    root.appendChild(node);
    setTimeout(() => node.remove(), duration + 50);
  }

  // ---------- Ripple ----------

  function ripple(x, y, color = 'rgba(167,139,250,0.4)', size = 200) {
    const root = layer();
    const r = document.createElement('div');
    r.className = 'juice-ripple';
    r.style.cssText = `
      left:${x - size / 2}px;top:${y - size / 2}px;
      width:${size}px;height:${size}px;
      background:radial-gradient(circle, ${color} 0%, transparent 70%);
    `;
    root.appendChild(r);
    setTimeout(() => r.remove(), 550);
  }

  // ---------- Element-targeted helpers ----------

  function getCenter(el) {
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function flashElement(el, klass = 'flash-success') {
    if (!el) return;
    el.classList.remove(klass);
    void el.offsetWidth;
    el.classList.add(klass);
    setTimeout(() => el.classList.remove(klass), 700);
  }

  function celebrateAt(el, color = '#22c55e') {
    const { x, y } = getCenter(el);
    spawnParticles({ x, y, color, count: 14, speed: 180 });
    ripple(x, y, color === '#22c55e' ? 'rgba(74,222,128,0.4)' : 'rgba(251,191,36,0.4)');
  }

  function shakeAndFlashError(el) {
    if (el) flashElement(el, 'flash-error');
    screenShake();
  }

  // ---------- Vibration (mobile) ----------

  function vibrate(pattern = 30) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {
      // ignore
    }
  }

  global.CipherJuice = {
    screenShake,
    spawnParticles,
    spawnConfetti,
    floatText,
    ripple,
    getCenter,
    flashElement,
    celebrateAt,
    shakeAndFlashError,
    vibrate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
