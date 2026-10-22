// ==================== LAB CATCH ENGINE ====================
// Bolt the robot slides along the lab floor carrying a beaker. Each question drops a few
// answer bubbles; catch the right one. Between questions: dodge slime, grab atoms and potions.

// The field is always LAB_H tall; its width stretches with the screen (LAB_W portrait up to LAB_MAX_W landscape).
const LAB_MAX_W = 1040;
function bubbleLayout(n, W) {
  const lane = W / n;
  const w = Math.min(lane * 0.84, n === 2 ? 340 : 270);
  return { xs: Array.from({ length: n }, (_, i) => lane * (i + 0.5)), w, h: n === 2 ? 104 : 112 };
}
const BOT_HALF_W = 46;
const FLOOR_Y = 800;
// Bubbles appear below the HUD + question card so their answers are readable right away.
const BUBBLE_SPAWN_Y = 310;

const LabImages = (() => {
  let cache = null;
  return () => {
    if (cache) return cache;
    cache = {};
    Object.entries({ ...SPRITE_PATHS, ...Object.fromEntries(Object.entries(BG_PATHS).map(([k, v]) => [`bg_${k}`, v])) }).forEach(([k, src]) => {
      const img = new Image();
      img.src = src;
      cache[k] = img;
    });
    return cache;
  };
})();

function imgReady(img) {
  return img && img.complete && img.naturalWidth > 0;
}

function drawContain(ctx, img, cx, cy, w, h) {
  const r = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

function drawCover(ctx, img, w, h) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

class LabRun {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    this.on = opts.on || {};
    this.audio = opts.audio;
    this.mastery = opts.mastery;
    this.boss = !!opts.boss;
    this.stageId = opts.stageId;
    this.theme = STAGE_THEMES[this.boss ? 'boss' : opts.stageId] || STAGE_THEMES.observe;
    this.bg = this.boss ? 'bg_boss' : `bg_${opts.stageId}`;
    this.goal = opts.goal;
    this.juice = new JuiceSystem();
    this.images = LabImages();
    this.W = LAB_W;

    this.bot = { x: this.W / 2, targetX: this.W / 2, tilt: 0, invuln: 0, squash: 0 };
    this.keys = new Set();
    this.objects = [];
    this.motes = Array.from({ length: 18 }, () => ({ x: Math.random() * this.W, y: Math.random() * LAB_H, r: 2 + Math.random() * 4, s: 10 + Math.random() * 20 }));

    this.queue = orderByNeed(opts.questions, this.mastery);
    this.phase = 'intro';
    this.timer = 1.2;
    this.spawnT = 0.5;
    this.round = null;
    this.fastDrop = false;
    this.stats = { correct: 0, answered: 0, combo: 0, maxCombo: 0, hearts: LAB_TUNING.maxHearts, coins: 0, missed: [] };
    this.time = 0;
    this.running = false;
    this.paused = false;

    this._onKey = this._onKey.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('pointerdown', this._onDown);
    canvas.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
  }

  // ---------- lifecycle ----------
  start() {
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      // Catch up after dropped frames in small steps so catches can't be skipped.
      let dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) {
        while (dt > 0) {
          const step = Math.min(dt, 1 / 30);
          this.update(step);
          dt -= step;
        }
      }
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.emit();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
  }

  setPaused(p) {
    this.paused = p;
    this.keys.clear();
    this.dragging = false;
  }

  fit(container) {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    this.W = Math.round(Math.max(LAB_W, Math.min(LAB_MAX_W, LAB_H * aspect)));
    const scale = Math.min(container.clientWidth / this.W, container.clientHeight / LAB_H);
    this.canvas.style.width = `${Math.floor(this.W * scale)}px`;
    this.canvas.style.height = `${Math.floor(LAB_H * scale)}px`;
    this.canvas.width = this.W * dpr;
    this.canvas.height = LAB_H * dpr;
    if (this.phase === 'intro') {
      this.bot.x = this.bot.targetX = this.W / 2;
      this.motes.forEach(m => { m.x = Math.random() * this.W; });
    } else {
      this.bot.targetX = Math.min(this.bot.targetX, this.W - BOT_HALF_W);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  emit() {
    if (this.on.stats) this.on.stats({ ...this.stats, goal: this.goal, dropping: this.phase === 'drop' && !this.fastDrop });
  }

  // ---------- input ----------
  drop() {
    if (this.phase !== 'drop' || this.fastDrop) return;
    this.fastDrop = true;
    this.emit();
  }

  _onKey(e) {
    if (this.paused) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { this.keys.add('l'); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { this.keys.add('r'); e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's' || k === ' ') { this.drop(); e.preventDefault(); }
    else if (['1', '2', '3'].includes(k) && this.round) {
      const xs = bubbleLayout(this.round.choices.length, this.W).xs;
      const i = Number(k) - 1;
      if (xs[i] != null) this.bot.targetX = xs[i];
    }
  }

  _onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this.keys.delete('l');
    if (k === 'arrowright' || k === 'd') this.keys.delete('r');
  }

  _logicalX(e) {
    const r = this.canvas.getBoundingClientRect();
    return (e.clientX - r.left) * (this.W / r.width);
  }

  _onDown(e) {
    if (this.paused) return;
    this.dragging = true;
    this.bot.targetX = this._logicalX(e);
  }

  _onMove(e) {
    if (!this.dragging || this.paused) return;
    this.bot.targetX = this._logicalX(e);
  }

  _onUp() {
    this.dragging = false;
  }

  // ---------- flow ----------
  _nextQuestion() {
    if (this.stats.correct >= this.goal) {
      this.phase = 'finish';
      this.timer = this.boss ? 2.4 : 1.4;
      this.juice.text(this.W / 2, 300, this.boss ? 'BLAST OFF!' : 'BEAKER FULL!', { color: '#fde047', size: 44, life: 1.6, rise: 30 });
      this.juice.burst(this.bot.x, CATCH_Y, { count: 50, speed: [200, 520], colors: ['#fde047', '#f472b6', '#60a5fa', '#4ade80'] });
      this.audio && this.audio.sfx(this.boss ? 'launch' : 'stage_done', { volume: 0.8 });
      if (this.boss) this.rocket = { y: LAB_H + 120, t: 0 };
      return;
    }
    if (!this.queue.length) this.queue = orderByNeed(this.opts.questions, this.mastery);
    const q = this.queue.shift();
    const n = Math.min(3, 1 + q.wrong.length);
    const choices = shuffle([q.a, ...q.wrong.slice(0, n - 1)]);
    this.round = { q, choices };
    this.phase = 'reading';
    this.timer = LAB_TUNING.readDelay + (q.q.length > 70 ? 0.8 : 0);
    if (this.on.question) this.on.question(q, choices);
  }

  _dropBubbles() {
    const { q, choices } = this.round;
    const lay = bubbleLayout(choices.length, this.W);
    const offsets = shuffle([0, 45, 90].slice(0, choices.length));
    choices.forEach((text, i) => {
      this.objects.push({ type: 'bubble', text, correct: text === q.a, x: lay.xs[i], y: BUBBLE_SPAWN_Y + offsets[i], w: lay.w, h: lay.h, wob: Math.random() * 6, age: 0 });
    });
    this.audio && this.audio.sfx('pop', { volume: 0.4, rate: 0.8 });
    this.hoverT = LAB_TUNING.hoverTime + q.q.length * LAB_TUNING.hoverPerChar;
    this.fastDrop = false;
    this.phase = 'drop';
    this.emit();
  }

  _resolve(caught) {
    const s = this.stats;
    const q = this.round.q;
    const correct = !!(caught && caught.correct);
    const bubbles = this.objects.filter(o => o.type === 'bubble');
    bubbles.forEach(o => {
      o.done = true;
      o.reveal = o.correct ? 'right' : o === caught ? 'wrong' : 'fade';
      o.fade = 1;
    });
    s.answered += 1;
    const bx = this.bot.x;
    if (correct) {
      s.correct += 1;
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      const bonus = 2 + Math.min(s.combo, 5);
      s.coins += bonus;
      caught.popped = true;
      this.bot.squash = 1;
      this.juice.hitstop(0.06);
      this.juice.flash('#86efac', 0.18);
      this.juice.shake(4, 0.15);
      this.juice.burst(bx, CATCH_Y, { count: 28, colors: ['#fde047', '#4ade80', '#ffffff', '#67e8f9'], speed: [160, 420] });
      this.juice.fizz(bx, CATCH_Y, 14);
      this.juice.text(bx, CATCH_Y - 60, s.combo > 1 ? `COMBO x${s.combo}!` : 'CORRECT!', { color: '#bbf7d0', size: 34 });
      this.juice.text(bx, CATCH_Y - 10, `+${bonus} ⚛️`, { color: '#fde047', size: 26, life: 1.1 });
      if (this.audio) {
        this.audio.sfx('correct');
        setTimeout(() => this.audio.sfx('pop', { volume: 0.6 }), 80);
        setTimeout(() => this.audio.sfx('coin', { volume: 0.5, rate: 1 + Math.min(s.combo, 6) * 0.06 }), 180);
      }
    } else {
      s.combo = 0;
      s.missed.push(q.id);
      if (caught) caught.popped = true;
      this._damage(false);
      this.juice.text(bx, CATCH_Y - 60, caught ? 'Not this one!' : 'Missed it!', { color: '#fecaca', size: 30 });
      this.audio && this.audio.sfx('wrong');
      const back = Math.min(2, this.queue.length);
      this.queue.splice(back, 0, q);
    }
    if (this.mastery) this.mastery.record(q.item, correct);
    if (this.on.answer) this.on.answer({ q, correct, missed: !caught, stats: { ...s } });
    this.round = null;
    this.fastDrop = false;
    if (this.phase !== 'broken') {
      if (s.correct >= this.goal) this._nextQuestion();
      else {
        this.phase = 'between';
        const [lo, hi] = LAB_TUNING.betweenTime;
        this.timer = lo + Math.random() * (hi - lo) + (correct ? 0 : 1.8);
        this.spawnT = 1.0;
      }
    }
    this.emit();
  }

  _damage(fromHazard) {
    const s = this.stats;
    // Slime can't take the last heart: only wrong answers can end the run.
    s.hearts = fromHazard ? Math.max(1, s.hearts - 1) : Math.max(0, s.hearts - 1);
    this.bot.invuln = 1.6;
    this.juice.shake(fromHazard ? 8 : 11, 0.3);
    this.juice.flash('#f87171', 0.22);
    this.juice.hitstop(0.08);
    if (this.on.hit) this.on.hit(s.hearts);
    if (s.hearts <= 0) {
      this.phase = 'broken';
      this.timer = 1.4;
    }
  }

  _spawnBetween() {
    const hard = this.boss || this.stageId === 'truefalse';
    const r = Math.random();
    const x = 50 + Math.random() * (this.W - 100);
    const [lo, hi] = LAB_TUNING.hazardSpeed;
    const speed = (lo + Math.random() * (hi - lo)) * (hard ? 1.15 : 1);
    if (this.stats.hearts < LAB_TUNING.maxHearts && r < 0.1) {
      this.objects.push({ type: 'potion', x, y: -40, w: 48, h: 58, vy: speed * 0.8 });
    } else if (r < (hard ? 0.62 : 0.52)) {
      this.objects.push({ type: 'slime', x, y: -50, w: 56, h: 66, vy: speed, rot: 0 });
      if (hard && Math.random() < 0.25) {
        const x2 = x < this.W / 2 ? x + 170 + Math.random() * 80 : x - 170 - Math.random() * 80;
        this.objects.push({ type: 'slime', x: Math.max(50, Math.min(this.W - 50, x2)), y: -120, w: 56, h: 66, vy: speed, rot: 0 });
      }
    } else {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.objects.push({ type: 'atom', x: Math.max(40, Math.min(this.W - 40, x + (i - n / 2) * 30)), y: -30 - i * 46, w: 32, h: 32, vy: speed * 0.75, phase: Math.random() * 6 });
    }
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    if (this.juice.freeze > 0) {
      this.juice.freeze -= dt;
      this.juice.update(dt * 0.2);
      return;
    }

    const b = this.bot;
    if (this.keys.has('l')) b.targetX = b.x - LAB_TUNING.botSpeed * 0.12;
    if (this.keys.has('r')) b.targetX = b.x + LAB_TUNING.botSpeed * 0.12;
    b.targetX = Math.max(BOT_HALF_W, Math.min(this.W - BOT_HALF_W, b.targetX));
    const prevX = b.x;
    const maxStep = (this.keys.size ? LAB_TUNING.botSpeed : 1100) * dt;
    const diff = b.targetX - b.x;
    b.x += Math.max(-maxStep, Math.min(maxStep, diff * Math.min(1, dt * 14)));
    const v = (b.x - prevX) / Math.max(dt, 1e-3);
    b.tilt += (Math.max(-0.25, Math.min(0.25, v / 2400)) - b.tilt) * Math.min(1, dt * 10);
    if (b.invuln > 0) b.invuln -= dt;
    if (b.squash > 0) b.squash = Math.max(0, b.squash - dt * 4);

    this.motes.forEach(m => {
      m.y -= m.s * dt;
      if (m.y < -10) { m.y = LAB_H + 10; m.x = Math.random() * this.W; }
    });
    if (Math.random() < dt * 4) this.juice.fizz(b.x, CATCH_Y + 10, 1);

    // phase machine
    this.timer -= dt;
    if (this.phase === 'intro' && this.timer <= 0) {
      this.phase = 'between';
      this.timer = 2.4;
      this.audio && this.audio.sfx('start', { volume: 0.6 });
    } else if (this.phase === 'between') {
      this.spawnT -= dt;
      // Stop spawning early so the air is clear before the answer bubbles drop.
      if (this.spawnT <= 0 && this.timer > 1.8) {
        this._spawnBetween();
        this.spawnT = this.boss ? 0.6 : 0.75;
      }
      if (this.timer <= 0) this._nextQuestion();
    } else if (this.phase === 'reading' && this.timer <= 0) {
      this._dropBubbles();
    } else if (this.phase === 'broken' && this.timer <= 0) {
      this.phase = 'done';
      if (this.on.end) this.on.end({ won: false, ...this.stats });
    } else if (this.phase === 'finish') {
      if (this.rocket) {
        this.rocket.t += dt;
        this.rocket.y -= (200 + this.rocket.t * 900) * dt;
        this.juice.burst(this.W / 2, this.rocket.y + 90, { count: 3, colors: ['#fdba74', '#fde047', '#f8fafc'], speed: [40, 140], angle: Math.PI / 2, spread: 0.8, gravity: 60, life: [0.4, 0.8], size: [5, 10] });
      }
      if (this.timer <= 0) {
        this.phase = 'done';
        if (this.on.end) this.on.end({ won: true, ...this.stats });
      }
    }

    // objects
    // Bubbles float in place until the question has been read aloud and Liam has had time to read the choices.
    if (this.phase === 'drop' && this.hoverT > 0 && !(this.audio && this.audio.isSpeaking())) this.hoverT -= dt;
    const hovering = this.phase === 'drop' && this.hoverT > 0 && !this.fastDrop;
    const bubbleSpeed = (this.boss ? LAB_TUNING.bossBubbleSpeed : LAB_TUNING.bubbleSpeed) * (this.fastDrop ? 4.5 : 1);
    for (const o of this.objects) {
      if (o.type === 'bubble') {
        o.age += dt;
        if (o.done) { o.fade -= dt * (o.reveal === 'right' ? 0.8 : 1.6); o.y += 30 * dt; continue; }
        if (!hovering) o.y += bubbleSpeed * dt;
      } else {
        o.y += o.vy * dt;
        if (o.type === 'slime') o.rot = Math.sin(this.time * 6 + o.x) * 0.15;
      }
    }

    if (this.phase === 'drop') this._checkBubbles();
    else if (this.phase !== 'done') this._checkPickups();

    this.objects = this.objects.filter(o => {
      if (o.type === 'bubble') return !(o.done && o.fade <= 0) && o.y < LAB_H + 120;
      return !o.hit && o.y < LAB_H + 80;
    });
    this.juice.update(dt);
  }

  _checkBubbles() {
    const b = this.bot;
    const live = this.objects.filter(o => o.type === 'bubble' && !o.done);
    for (const o of live) {
      const bottom = o.y + o.h / 2;
      if (bottom >= CATCH_Y && bottom <= CATCH_Y + 70 && Math.abs(o.x - b.x) < o.w / 2) {
        this._resolve(o);
        return;
      }
    }
    const right = live.find(o => o.correct);
    if (right && right.y - right.h / 2 > CATCH_Y + 10) this._resolve(null);
  }

  _checkPickups() {
    const b = this.bot;
    for (const o of this.objects) {
      if (o.hit || o.type === 'bubble') continue;
      const pickup = o.type !== 'slime';
      const overlapX = Math.abs(o.x - b.x) < o.w / 2 + (pickup ? 34 : 22);
      const overlapY = Math.abs(o.y - (BOT_Y - 20)) < o.h / 2 + (pickup ? 60 : 40);
      if (!overlapX || !overlapY) continue;
      if (o.type === 'atom') {
        o.hit = true;
        this.stats.coins += 1;
        this.juice.burst(o.x, o.y, { count: 8, colors: ['#fde047', '#67e8f9'], speed: [80, 180], life: [0.3, 0.5] });
        this.juice.text(o.x, o.y - 10, '+1', { size: 20, life: 0.6, rise: 40 });
        this.audio && this.audio.sfx('coin', { volume: 0.45, rate: 0.95 + Math.random() * 0.2 });
        this.emit();
      } else if (o.type === 'potion') {
        o.hit = true;
        this.stats.hearts = Math.min(LAB_TUNING.maxHearts, this.stats.hearts + 1);
        this.juice.burst(o.x, o.y, { count: 16, colors: ['#f87171', '#ffffff'], speed: [100, 240] });
        this.juice.text(o.x, o.y - 20, '+1 ❤️', { color: '#fecaca', size: 26 });
        this.audio && this.audio.sfx('heal', { volume: 0.7 });
        this.emit();
      } else if (o.type === 'slime' && b.invuln <= 0 && this.phase !== 'finish') {
        o.hit = true;
        this.audio && this.audio.sfx('splat');
        this.juice.burst(b.x, BOT_Y - 30, { count: 18, colors: ['#4ade80', '#22c55e', '#bbf7d0'], speed: [80, 260] });
        this.juice.text(b.x, BOT_Y - 110, 'SPLAT!', { color: '#bbf7d0', size: 30 });
        this._damage(true);
        this.emit();
      }
    }
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx;
    const sh = this.juice.shakeOffset();
    ctx.save();
    ctx.clearRect(0, 0, this.W, LAB_H);
    ctx.translate(sh.x, sh.y);

    const bg = this.images[this.bg];
    if (imgReady(bg)) drawCover(ctx, bg, this.W, LAB_H);
    else {
      const g = ctx.createLinearGradient(0, 0, 0, LAB_H);
      g.addColorStop(0, '#1e3a8a');
      g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g;
      ctx.fillRect(-20, -20, this.W + 40, LAB_H + 40);
    }
    ctx.fillStyle = this.theme.tint;
    ctx.fillRect(-20, -20, this.W + 40, LAB_H + 40);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    this.motes.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill(); });

    // lab counter floor
    ctx.fillStyle = this.theme.floor;
    ctx.fillRect(-20, FLOOR_Y, this.W + 40, LAB_H - FLOOR_Y + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-20, FLOOR_Y, this.W + 40, 6);

    const order = { atom: 1, potion: 1, slime: 2, bubble: 3 };
    this.objects.slice().sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0)).forEach(o => this._drawObject(ctx, o));

    if (this.rocket) this._drawRocket(ctx);
    this._drawBot(ctx);
    this.juice.renderParticles(ctx);
    this.juice.renderTexts(ctx);
    ctx.restore();
    this.juice.renderFlash(ctx, this.W, LAB_H);
  }

  _drawObject(ctx, o) {
    if (o.type === 'bubble') return this._drawBubble(ctx, o);
    if (o.type === 'atom') {
      const t = this.time * 3 + o.phase;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 6, t * 0.6 + (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    const img = this.images[o.type];
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);
    if (imgReady(img)) {
      drawContain(ctx, img, 0, 0, o.w * 1.25, o.h * 1.25);
    } else if (o.type === 'slime') {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.moveTo(0, -o.h / 2); ctx.quadraticCurveTo(o.w / 2, 0, 0, o.h / 2); ctx.quadraticCurveTo(-o.w / 2, 0, 0, -o.h / 2); ctx.fill();
    } else if (o.type === 'potion') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 6, o.w / 2 - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-7, -o.h / 2, 14, 16);
    }
    ctx.restore();
  }

  _drawBubble(ctx, o) {
    const wob = o.done ? 0 : Math.sin(this.time * 2.4 + o.wob) * 4;
    const x = o.x + wob;
    const y = o.y;
    const alpha = o.done ? Math.max(0, o.fade) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (!o.done) {
      // drop guide to the floor
      ctx.setLineDash([8, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(o.x, y + o.h / 2 + 6); ctx.lineTo(o.x, FLOOR_Y); ctx.stroke();
      ctx.setLineDash([]);
    }

    let fill = 'rgba(255,255,255,0.94)', border = this.theme.accent;
    if (o.reveal === 'right') { fill = '#bbf7d0'; border = '#16a34a'; }
    else if (o.reveal === 'wrong') { fill = '#fecaca'; border = '#dc2626'; }
    else if (o.reveal === 'fade') { fill = 'rgba(255,255,255,0.6)'; border = 'rgba(148,163,184,0.6)'; }

    const appear = EASE.outBack(Math.min(1, o.age / 0.3));
    const scale = (o.popped ? 1 + (1 - alpha) * 0.4 : 1) * appear;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    roundRect(ctx, -o.w / 2 + 4, -o.h / 2 + 6, o.w, o.h, 40); ctx.fill();
    ctx.fillStyle = fill;
    roundRect(ctx, -o.w / 2, -o.h / 2, o.w, o.h, 40); ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = border;
    ctx.stroke();
    // glassy shine
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-o.w / 2 + 26, -o.h / 2 + 20, 14, 7, -0.5, 0, Math.PI * 2); ctx.fill();

    const tf = o.text === 'True' || o.text === 'False';
    let size = tf ? 34 : (o.w > 220 ? 27 : 22);
    let lines;
    do {
      ctx.font = `700 ${size}px Fredoka, sans-serif`;
      lines = wrapLines(ctx, o.text, o.w - 24);
      size -= 1;
    } while ((lines.length > 3 || lines.some(l => ctx.measureText(l).width > o.w - 18)) && size > 12);
    ctx.fillStyle = tf ? (o.text === 'True' ? '#15803d' : '#b91c1c') : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = size + 4;
    const label = tf ? (o.text === 'True' ? '✔ TRUE' : '✘ FALSE') : null;
    if (label) ctx.fillText(label, 0, 2);
    else lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh + 2));
    ctx.restore();
  }

  _drawBot(ctx) {
    const b = this.bot;
    if (b.invuln > 0 && Math.floor(b.invuln * 12) % 2 === 0) return;
    // catch zone glow while bubbles fall
    if (this.phase === 'drop') {
      const g = ctx.createRadialGradient(b.x, CATCH_Y, 4, b.x, CATCH_Y, 60);
      g.addColorStop(0, 'rgba(253,224,71,0.55)');
      g.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(b.x, CATCH_Y, 60, 22, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(b.x, FLOOR_Y + 4, 48, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    const sq = Math.sin(b.squash * Math.PI) * 0.12;
    ctx.translate(b.x, BOT_Y + Math.sin(this.time * 5) * 2);
    ctx.rotate(b.tilt);
    ctx.scale(1 + sq, 1 - sq);
    const img = this.images.bolt;
    if (imgReady(img)) {
      // The sprite holds its flask up on the left; shift so the flask mouth sits over bot.x.
      drawContain(ctx, img, 38, 0, 130, 150);
    } else {
      ctx.fillStyle = '#14b8a6';
      roundRect(ctx, -34, -10, 68, 60, 18); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-12, 14, 8, 0, Math.PI * 2); ctx.arc(12, 14, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(-12, 14, 4, 0, Math.PI * 2); ctx.arc(12, 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(224,242,254,0.95)';
      ctx.fillStyle = 'rgba(103,232,249,0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-30, -70); ctx.lineTo(-24, -14); ctx.lineTo(24, -14); ctx.lineTo(30, -70); ctx.stroke();
      ctx.fillRect(-26, -42, 52, 28);
    }
    ctx.restore();
  }

  _drawRocket(ctx) {
    const img = this.images.rocket;
    const y = this.rocket.y;
    if (imgReady(img)) drawContain(ctx, img, this.W / 2, y, 150, 220);
    else {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(this.W / 2, y - 100); ctx.lineTo(this.W / 2 + 40, y + 60); ctx.lineTo(this.W / 2 - 40, y + 60); ctx.fill();
    }
  }
}
