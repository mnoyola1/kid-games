// ==================== MATH MAGE — JUICE HELPERS ====================
// CSS-driven particles, screen-shake, floating-text. Phase 1 keeps it pure
// DOM (no canvas) so we can ship today. The interfaces match what main.js
// expects so a Phase 4 canvas-particle upgrade is a drop-in replacement.

(function () {
  // ---- Floating text ("+12 XP", "+1 combo", "-1 HP") ----
  // Spawns a transient absolute-positioned <div> inside the given container,
  // animates via CSS, removes after the animation. Caller passes container
  // + page-relative click point (clientX/clientY) and we map into container
  // coordinates.
  function floatingText(container, { clientX, clientY, text, kind = 'good' }) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const el = document.createElement('div');
    el.className = `mm-float mm-float-${kind} text-2xl sm:text-3xl`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch (e) {} }, 1200);
  }

  // ---- Spark burst at a point ----
  // Phase 1 uses small DOM dots animated outward via CSS variables.
  // count: how many sparks; colors: array of CSS colors.
  function sparkBurst(container, { clientX, clientY, count = 10, colors = ['#ffd784', '#b9f0ff', '#ff9bd4'], radius = 80 }) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = radius * (0.6 + Math.random() * 0.6);
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      const el = document.createElement('div');
      el.className = 'mm-spark';
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      el.style.background = colors[i % colors.length];
      el.style.boxShadow = `0 0 12px ${colors[i % colors.length]}`;
      el.style.setProperty('--sx', `${sx}px`);
      el.style.setProperty('--sy', `${sy}px`);
      container.appendChild(el);
      setTimeout(() => { try { el.remove(); } catch (e) {} }, 900);
    }
  }

  // ---- Screen shake ----
  // Adds a class for `duration` ms, then strips it. CSS keyframes do the work.
  function shake(target, { soft = false, duration = 280 } = {}) {
    if (!target) return;
    const cls = soft ? 'mm-shake-soft' : 'mm-shake';
    target.classList.remove(cls); // reset if mid-shake
    void target.offsetWidth;       // force reflow so animation restarts
    target.classList.add(cls);
    setTimeout(() => { try { target.classList.remove(cls); } catch (e) {} }, duration);
  }

  // ---- Wave-clear / wrong-flash ----
  function flash(container, { kind = 'good', duration = 380 } = {}) {
    if (!container) return;
    const el = document.createElement('div');
    el.className = kind === 'bad' ? 'mm-flash-bad' : 'mm-flash-good';
    container.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch (e) {} }, duration);
  }

  window.MathMageJuice = {
    floatingText,
    sparkBurst,
    shake,
    flash,
  };
})();
