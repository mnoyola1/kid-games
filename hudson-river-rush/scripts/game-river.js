// ==================== RIVER RUN ENGINE ====================
// Top-down 3-lane river runner. Questions arrive as a row of answer buoys; steer the
// tugboat through the right one. Between questions: dodge logs/rocks/ice, grab coins.

const RIVER_LEFT = 60;
const RIVER_RIGHT = RIVER_W - 60;
const LANE_W = (RIVER_RIGHT - RIVER_LEFT) / LANES;
const GATE_H = 100;
const laneX = lane => RIVER_LEFT + LANE_W * (lane + 0.5);

const RiverImages = (() => {
  let cache = null;
  return () => {
    if (cache) return cache;
    cache = {};
    Object.entries(SPRITE_PATHS).forEach(([k, src]) => {
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

const OBSTACLE_SETS = {
  harbor: ['rock', 'log'],
  hudson: ['log', 'rock', 'log'],
  adirondacks: ['log', 'log', 'rock'],
  canal: ['log', 'rock'],
  niagara: ['ice', 'ice', 'snow'],
};

const OBSTACLE_SIZE = {
  log: { w: 118, h: 50 },
  rock: { w: 80, h: 76 },
  ice: { w: 92, h: 70 },
  snow: { w: LANE_W - 10, h: 130 },
};

class RiverRun {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    this.on = opts.on || {};
    this.audio = opts.audio;
    this.mastery = opts.mastery;
    this.boss = !!opts.boss;
    this.themeId = opts.themeId;
    this.theme = LEG_THEMES[opts.themeId];
    this.goal = opts.goal;
    this.juice = new JuiceSystem();
    this.images = RiverImages();

    this.boat = { lane: 1, x: laneX(1), fromX: laneX(1), toX: laneX(1), t: 1, tilt: 0, invuln: 0 };
    this.speed = RIVER_TUNING.cruiseSpeed;
    this.targetSpeed = this.speed;
    this.objects = [];
    this.scenery = [];
    this.ripples = Array.from({ length: 34 }, () => ({
      x: RIVER_LEFT + Math.random() * (RIVER_RIGHT - RIVER_LEFT),
      y: Math.random() * RIVER_H,
      w: 10 + Math.random() * 22,
    }));
    this._seedScenery();

    this.queue = orderByNeed(opts.questions, this.mastery);
    this.phase = 'intro';
    this.timer = 1.4;
    this.spawnT = 0.4;
    this.phaseCount = 0;
    this.gate = null;
    this.stats = { correct: 0, answered: 0, combo: 0, maxCombo: 0, hull: RIVER_TUNING.maxHull, coins: 0, missed: [] };
    this.boostT = 0;
    this.slowT = 0;
    this.snowTextCooldown = 0;
    this.time = 0;
    this.running = false;
    this.paused = false;

    this._onKey = this._onKey.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onUp = this._onUp.bind(this);
    window.addEventListener('keydown', this._onKey);
    canvas.addEventListener('pointerdown', this._onDown);
    canvas.addEventListener('pointerup', this._onUp);
  }

  // ---------- lifecycle ----------
  start() {
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) this.update(dt);
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
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointerup', this._onUp);
  }

  setPaused(p) {
    this.paused = p;
  }

  fit(container) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(container.clientWidth / RIVER_W, container.clientHeight / RIVER_H);
    this.canvas.style.width = `${Math.floor(RIVER_W * scale)}px`;
    this.canvas.style.height = `${Math.floor(RIVER_H * scale)}px`;
    this.canvas.width = RIVER_W * dpr;
    this.canvas.height = RIVER_H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  emit() {
    if (this.on.stats) this.on.stats({ ...this.stats, goal: this.goal });
  }

  // ---------- input ----------
  steer(dir) {
    this.toLane(Math.max(0, Math.min(LANES - 1, this.boat.lane + dir)));
  }

  toLane(lane) {
    if (this.phase === 'done' || this.phase === 'sunk' || lane === this.boat.lane) return;
    const b = this.boat;
    b.tilt = (lane > b.lane ? 1 : -1) * 0.32;
    b.fromX = b.x;
    b.toX = laneX(lane);
    b.t = 0;
    b.lane = lane;
    this.audio && this.audio.sfx('steer', { volume: 0.5, rate: 0.9 + Math.random() * 0.2 });
    this.juice.splash(b.x, BOAT_Y + 30, 5);
  }

  _onKey(e) {
    if (this.paused) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { this.steer(-1); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { this.steer(1); e.preventDefault(); }
    else if (k === '1' || k === '2' || k === '3') this.toLane(Number(k) - 1);
  }

  _logical(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (RIVER_W / r.width), y: (e.clientY - r.top) * (RIVER_H / r.height) };
  }

  _onDown(e) {
    this.down = { ...this._logical(e), t: performance.now() };
  }

  _onUp(e) {
    if (!this.down || this.paused) return;
    const p = this._logical(e);
    const dx = p.x - this.down.x;
    if (Math.abs(dx) > 45) this.steer(dx > 0 ? 1 : -1);
    else {
      const lane = Math.floor((p.x - RIVER_LEFT) / LANE_W);
      if (p.x < RIVER_LEFT) this.steer(-1);
      else if (p.x > RIVER_RIGHT) this.steer(1);
      else this.toLane(Math.max(0, Math.min(LANES - 1, lane)));
    }
    this.down = null;
  }

  // ---------- flow ----------
  _nextQuestion() {
    if (this.stats.correct >= this.goal) {
      this.phase = 'finish';
      this.objects.push({ type: 'finish', y: -80, lane: 1, w: RIVER_RIGHT - RIVER_LEFT, h: 60 });
      this.juice.text(RIVER_W / 2, 260, 'DOCK AHEAD!', { color: '#fde047', size: 40, life: 1.6, rise: 30 });
      this.targetSpeed = RIVER_TUNING.cruiseSpeed;
      return;
    }
    if (!this.queue.length) this.queue = orderByNeed(this.opts.questions, this.mastery);
    const q = this.queue.shift();
    const choices = shuffle([q.a, ...q.wrong.slice(0, LANES - 1)]);
    this.pendingQ = { q, choices };
    this.phase = 'reading';
    this.timer = RIVER_TUNING.readDelay;
    this.targetSpeed = this.boss ? RIVER_TUNING.bossQuestionSpeed : RIVER_TUNING.questionSpeed;
    if (this.on.question) this.on.question(q, choices);
  }

  _spawnGate() {
    const { q, choices } = this.pendingQ;
    this.gate = { type: 'gate', q, choices, y: -GATE_H, resolved: false, chosen: -1, correctLane: choices.indexOf(q.a), bob: Math.random() * 6 };
    this.objects.push(this.gate);
    this.phase = 'gate';
  }

  _resolveGate(g) {
    g.resolved = true;
    const b = this.boat;
    const lane = Math.max(0, Math.min(LANES - 1, Math.floor((b.x - RIVER_LEFT) / LANE_W)));
    g.chosen = lane;
    const correct = lane === g.correctLane;
    const s = this.stats;
    s.answered += 1;
    const gx = laneX(lane);
    if (correct) {
      s.correct += 1;
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      const bonus = 2 + Math.min(s.combo, 5);
      s.coins += bonus;
      this.boostT = RIVER_TUNING.boostTime;
      this.juice.hitstop(0.06);
      this.juice.flash('#86efac', 0.18);
      this.juice.shake(4, 0.15);
      this.juice.burst(gx, BOAT_Y - 40, { count: 26, colors: ['#fde047', '#4ade80', '#ffffff', '#facc15'], speed: [160, 420] });
      this.juice.text(gx, BOAT_Y - 90, s.combo > 1 ? `COMBO x${s.combo}!` : 'CORRECT!', { color: '#bbf7d0', size: 34 });
      this.juice.text(gx, BOAT_Y - 40, `+${bonus} 🪙`, { color: '#fde047', size: 26, life: 1.1 });
      if (this.audio) {
        this.audio.sfx('correct');
        setTimeout(() => this.audio.sfx('boost', { volume: 0.6 }), 90);
        setTimeout(() => this.audio.sfx('coin', { volume: 0.5, rate: 1 + Math.min(s.combo, 6) * 0.06 }), 180);
      }
    } else {
      s.combo = 0;
      s.missed.push(g.q.id);
      this._damage(false);
      this.juice.text(gx, BOAT_Y - 80, 'Not this one!', { color: '#fecaca', size: 30 });
      this.audio && this.audio.sfx('wrong');
      const back = Math.min(2, this.queue.length);
      this.queue.splice(back, 0, g.q);
    }
    if (this.mastery) this.mastery.record(g.q.item, correct);
    if (this.on.answer) this.on.answer({ q: g.q, correct, chosen: g.choices[lane], stats: { ...s } });
    this.emit();
    this.gate = null;
    if (this.phase === 'sunk') return;
    if (s.correct >= this.goal) {
      this._nextQuestion();
      return;
    }
    this.phase = 'obstacles';
    this.phaseCount += 1;
    const [lo, hi] = RIVER_TUNING.obstacleGap;
    this.timer = lo + Math.random() * (hi - lo) + (correct ? 0 : 1.8);
    this.spawnT = 0.9;
    this.targetSpeed = RIVER_TUNING.cruiseSpeed + (this.boss ? 40 : 0);
  }

  _damage(fromObstacle) {
    const s = this.stats;
    // Obstacles can't take the last heart: only wrong answers can sink the boat.
    s.hull = fromObstacle ? Math.max(1, s.hull - 1) : Math.max(0, s.hull - 1);
    this.boat.invuln = 1.8;
    this.juice.shake(fromObstacle ? 9 : 11, 0.3);
    this.juice.flash('#f87171', 0.22);
    this.juice.hitstop(0.08);
    this.juice.splash(this.boat.x, BOAT_Y - 30, 18);
    if (this.on.hit) this.on.hit(s.hull);
    if (s.hull <= 0) {
      this.phase = 'sunk';
      this.timer = 1.4;
      this.targetSpeed = 0;
    }
  }

  _spawnRow() {
    const set = OBSTACLE_SETS[this.themeId] || OBSTACLE_SETS.hudson;
    const hard = this.boss || ['canal', 'niagara'].includes(this.themeId);
    const blockCount = !this.lastRowDouble && Math.random() < (hard ? 0.18 : 0.1) ? 2 : 1;
    this.lastRowDouble = blockCount === 2;
    const lanes = shuffle([0, 1, 2]);
    const blocked = lanes.slice(0, blockCount);
    const free = lanes.slice(blockCount);
    blocked.forEach(lane => {
      const type = set[Math.floor(Math.random() * set.length)];
      const size = OBSTACLE_SIZE[type];
      this.objects.push({ type, lane, x: laneX(lane) + (type === 'snow' ? 0 : (Math.random() - 0.5) * 16), y: -size.h, w: size.w, h: size.h, rot: (Math.random() - 0.5) * 0.4, spin: (Math.random() - 0.5) * 0.6 });
    });
    const coinLane = free[Math.floor(Math.random() * free.length)];
    if (this.stats.hull < RIVER_TUNING.maxHull && Math.random() < 0.3) {
      this.objects.push({ type: 'ring', lane: coinLane, x: laneX(coinLane), y: -50, w: 50, h: 50 });
    } else if (Math.random() < 0.75) {
      for (let i = 0; i < 3; i++) this.objects.push({ type: 'coin', lane: coinLane, x: laneX(coinLane), y: -40 - i * 52, w: 34, h: 34, phase: Math.random() * 6 });
    }
    if (Math.random() < 0.4) {
      const cloudLane = free.find(l => l !== coinLane) ?? coinLane;
      const size = OBSTACLE_SIZE.snow;
      this.objects.push({ type: 'snow', lane: cloudLane, x: laneX(cloudLane), y: -size.h - 60, w: size.w, h: size.h, rot: 0, spin: 0 });
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

    const b = this.boat;
    if (b.t < 1) {
      b.t = Math.min(1, b.t + dt / 0.17);
      b.x = b.fromX + (b.toX - b.fromX) * EASE.outBack(b.t);
    }
    b.tilt *= Math.pow(0.0008, dt);
    if (b.invuln > 0) b.invuln -= dt;

    if (this.boostT > 0) this.boostT -= dt;
    if (this.slowT > 0) this.slowT -= dt;
    if (this.snowTextCooldown > 0) this.snowTextCooldown -= dt;
    let target = this.targetSpeed * (this.boostT > 0 ? 1.45 : 1) * (this.slowT > 0 ? 0.55 : 1);
    this.speed += (target - this.speed) * Math.min(1, dt * 3);
    const dy = this.speed * dt;

    this.ripples.forEach(r => {
      r.y += dy;
      if (r.y > RIVER_H + 10) { r.y -= RIVER_H + 20; r.x = RIVER_LEFT + Math.random() * (RIVER_RIGHT - RIVER_LEFT); }
    });
    this.scenery.forEach(s => { s.y += dy; });
    this.scenery = this.scenery.filter(s => s.y < RIVER_H + 140);
    this._topUpScenery();

    if (Math.random() < dt * 30) this.juice.wake(b.x, BOAT_Y + 52);

    // phase machine
    this.timer -= dt;
    if (this.phase === 'intro' && this.timer <= 0) {
      this.phase = 'obstacles';
      this.timer = 2.2;
      this.audio && this.audio.sfx('horn', { volume: 0.7 });
    } else if (this.phase === 'obstacles') {
      this.spawnT -= dt;
      // Stop spawning early so the water in front of the answer buoys is clear.
      if (this.spawnT <= 0 && this.timer > 2.2) {
        this._spawnRow();
        this.spawnT = Math.max(1.6, 420 / this.speed);
      }
      if (this.timer <= 0) this._nextQuestion();
    } else if (this.phase === 'reading' && this.timer <= 0) {
      this._spawnGate();
    } else if (this.phase === 'sunk' && this.timer <= 0) {
      this.phase = 'done';
      if (this.on.end) this.on.end({ won: false, ...this.stats });
    }

    // objects
    this.objects.forEach(o => {
      o.y += dy;
      if (o.spin) o.rot += o.spin * dt;
    });

    for (const o of this.objects) {
      if (o.type === 'gate') {
        if (!o.resolved && o.y + GATE_H / 2 >= BOAT_Y - 34) this._resolveGate(o);
        continue;
      }
      if (o.type === 'finish') {
        if (!o.hit && o.y >= BOAT_Y - 40) {
          o.hit = true;
          this.phase = 'done';
          this.juice.flash('#fde047', 0.3);
          this.juice.burst(RIVER_W / 2, BOAT_Y - 60, { count: 40, speed: [200, 500], colors: ['#fde047', '#f472b6', '#60a5fa', '#4ade80'] });
          if (this.on.end) this.on.end({ won: true, ...this.stats });
        }
        continue;
      }
      if (o.hit) continue;
      const pickup = o.type === 'coin' || o.type === 'ring';
      const overlapX = Math.abs(o.x - b.x) < o.w / 2 + (pickup ? 20 : 4);
      const overlapY = Math.abs(o.y - BOAT_Y) < o.h / 2 + (pickup ? 34 : 18);
      if (!overlapX || !overlapY) continue;
      if (o.type === 'coin') {
        o.hit = true;
        this.stats.coins += 1;
        this.juice.burst(o.x, o.y, { count: 8, colors: ['#fde047', '#facc15'], speed: [80, 180], life: [0.3, 0.5] });
        this.juice.text(o.x, o.y - 10, '+1', { size: 20, life: 0.6, rise: 40 });
        this.audio && this.audio.sfx('coin', { volume: 0.45, rate: 0.95 + Math.random() * 0.2 });
        this.emit();
      } else if (o.type === 'ring') {
        o.hit = true;
        this.stats.hull = Math.min(RIVER_TUNING.maxHull, this.stats.hull + 1);
        this.juice.burst(o.x, o.y, { count: 16, colors: ['#f87171', '#ffffff'], speed: [100, 240] });
        this.juice.text(o.x, o.y - 20, '+1 ❤️', { color: '#fecaca', size: 26 });
        this.audio && this.audio.sfx('correct', { volume: 0.5, rate: 1.2 });
        this.emit();
      } else if (o.type === 'snow') {
        o.hit = true;
        this.slowT = RIVER_TUNING.snowSlowTime;
        this.juice.burst(b.x, BOAT_Y - 20, { count: 18, colors: ['#ffffff', '#e0f2fe'], speed: [60, 200], gravity: 120 });
        if (this.snowTextCooldown <= 0) {
          this.juice.text(b.x, BOAT_Y - 90, 'Lake-effect snow!', { color: '#e0f2fe', size: 26, life: 1.2 });
          this.snowTextCooldown = 4;
        }
        this.audio && this.audio.sfx('snow');
      } else if (b.invuln <= 0 && this.phase !== 'done' && this.phase !== 'finish') {
        o.hit = true;
        o.vx = (o.x < b.x ? -1 : 1) * 160;
        this.audio && this.audio.sfx('splash');
        this.juice.text(b.x, BOAT_Y - 80, 'BONK!', { color: '#fca5a5', size: 30 });
        this._damage(true);
        this.emit();
      }
    }
    this.objects.forEach(o => { if (o.hit && o.vx) { o.x += o.vx * dt; } });
    this.objects = this.objects.filter(o => o.y < RIVER_H + 160 && !(o.hit && (o.type === 'coin' || o.type === 'ring')));

    this.juice.update(dt, 0);
  }

  // ---------- scenery ----------
  _seedScenery() {
    for (let y = RIVER_H + 60; y > -160; y -= 70 + Math.random() * 40) {
      this.scenery.push(this._sceneryItem(0, y));
      this.scenery.push(this._sceneryItem(1, y - 30 - Math.random() * 30));
    }
  }

  _sceneryItem(side, y) {
    return { side, y, seed: Math.random(), h: 60 + Math.random() * 50 };
  }

  _topUpScenery() {
    [0, 1].forEach(side => {
      const items = this.scenery.filter(s => s.side === side);
      const top = items.length ? Math.min(...items.map(s => s.y)) : RIVER_H;
      if (top > -120) this.scenery.push(this._sceneryItem(side, top - 70 - Math.random() * 40));
    });
  }

  _drawScenery(ctx, s) {
    const kind = this.theme.scenery;
    const x0 = s.side === 0 ? 4 : RIVER_RIGHT + 8;
    const w = RIVER_LEFT - 12;
    const cx = x0 + w / 2;
    const r = s.seed;
    ctx.save();
    if (kind === 'city') {
      const bw = w * (0.7 + r * 0.3);
      const bh = 50 + r * 45;
      ctx.fillStyle = ['#475569', '#64748b', '#334155', '#78716c'][Math.floor(r * 4)];
      ctx.fillRect(cx - bw / 2, s.y - bh / 2, bw, bh);
      ctx.fillStyle = 'rgba(253,224,71,0.85)';
      for (let yy = s.y - bh / 2 + 6; yy < s.y + bh / 2 - 6; yy += 10) {
        for (let xx = cx - bw / 2 + 5; xx < cx + bw / 2 - 5; xx += 9) {
          if ((xx * 7 + yy * 3 + r * 100) % 5 > 1.4) ctx.fillRect(xx, yy, 4, 5);
        }
      }
    } else if (kind === 'cliffs') {
      ctx.fillStyle = r > 0.5 ? '#a16207' : '#78716c';
      ctx.beginPath();
      ctx.moveTo(x0, s.y + 30);
      ctx.lineTo(x0 + w * 0.3, s.y - 30 - r * 20);
      ctx.lineTo(x0 + w * 0.8, s.y - 20);
      ctx.lineTo(x0 + w, s.y + 30);
      ctx.closePath();
      ctx.fill();
      this._tree(ctx, cx + (r - 0.5) * 16, s.y + 34, 14, ['#ea580c', '#ca8a04', '#15803d'][Math.floor(r * 3)]);
    } else if (kind === 'pines' || kind === 'snow') {
      const n = 2 + Math.floor(r * 2);
      for (let i = 0; i < n; i++) {
        this._pine(ctx, x0 + 10 + ((r * 97 + i * 37) % (w - 16)), s.y + i * 26 - 20, 13 + ((r * 50 + i * 11) % 8), kind === 'snow');
      }
      if (kind === 'pines' && r > 0.8) this._tree(ctx, cx, s.y + 40, 12, '#dc2626');
    } else if (kind === 'farms') {
      ctx.fillStyle = r > 0.5 ? '#84cc16' : '#a3e635';
      ctx.fillRect(x0, s.y - 30, w, 60);
      ctx.strokeStyle = 'rgba(77,124,15,0.5)';
      ctx.lineWidth = 2;
      for (let yy = s.y - 26; yy < s.y + 28; yy += 8) { ctx.beginPath(); ctx.moveTo(x0 + 2, yy); ctx.lineTo(x0 + w - 2, yy); ctx.stroke(); }
      if (r > 0.65) {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(cx - 14, s.y - 14, 28, 24);
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath(); ctx.moveTo(cx - 17, s.y - 14); ctx.lineTo(cx, s.y - 28); ctx.lineTo(cx + 17, s.y - 14); ctx.fill();
      } else if (r > 0.3) {
        this._cow(ctx, cx - 6, s.y, r);
        this._cow(ctx, cx + 8, s.y + 16, 1 - r);
      }
    }
    ctx.restore();
  }

  _pine(ctx, x, y, size, snowy) {
    ctx.fillStyle = snowy ? '#14532d' : '#166534';
    ctx.beginPath(); ctx.moveTo(x, y - size * 1.4); ctx.lineTo(x + size, y + size * 0.6); ctx.lineTo(x - size, y + size * 0.6); ctx.fill();
    ctx.fillStyle = snowy ? '#f8fafc' : '#15803d';
    ctx.beginPath(); ctx.moveTo(x, y - size * 1.4); ctx.lineTo(x + size * 0.5, y - size * 0.4); ctx.lineTo(x - size * 0.5, y - size * 0.4); ctx.fill();
  }

  _tree(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2); ctx.fill();
  }

  _cow(ctx, x, y, r) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(x - 3 + r * 4, y - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 9, y - 2, 3, 0, Math.PI * 2); ctx.fill();
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx;
    const sh = this.juice.shakeOffset();
    ctx.save();
    ctx.clearRect(0, 0, RIVER_W, RIVER_H);
    ctx.translate(sh.x, sh.y);

    const g = ctx.createLinearGradient(0, 0, 0, RIVER_H);
    g.addColorStop(0, this.theme.water[0]);
    g.addColorStop(1, this.theme.water[1]);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, RIVER_W + 40, RIVER_H + 40);

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    this.ripples.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.w, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    });

    if (this.boostT > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const x = RIVER_LEFT + ((i * 53 + this.time * 900) % (RIVER_RIGHT - RIVER_LEFT));
        const y = (i * 131 + this.time * 1600) % RIVER_H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke();
      }
    }

    // banks
    ctx.fillStyle = this.theme.bank;
    ctx.fillRect(-20, -20, RIVER_LEFT + 20, RIVER_H + 40);
    ctx.fillRect(RIVER_RIGHT, -20, RIVER_W - RIVER_RIGHT + 20, RIVER_H + 40);
    this.scenery.forEach(s => this._drawScenery(ctx, s));
    ctx.fillStyle = this.theme.bankEdge;
    ctx.fillRect(RIVER_LEFT - 6, -20, 6, RIVER_H + 40);
    ctx.fillRect(RIVER_RIGHT, -20, 6, RIVER_H + 40);

    // lane guides
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = -(this.time * this.speed) % 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 3;
    for (let i = 1; i < LANES; i++) {
      const x = RIVER_LEFT + LANE_W * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, RIVER_H); ctx.stroke();
    }
    ctx.setLineDash([]);

    const order = { snow: 0, coin: 1, ring: 1, log: 2, rock: 2, ice: 2, finish: 3, gate: 4 };
    this.objects.slice().sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0)).forEach(o => this._drawObject(ctx, o));

    this._drawBoat(ctx);
    this.juice.renderParticles(ctx);
    if (this.boss) this._drawFalls(ctx);
    this.juice.renderTexts(ctx);
    ctx.restore();
    this.juice.renderFlash(ctx, RIVER_W, RIVER_H);
  }

  _drawObject(ctx, o) {
    const img = this.images[o.type];
    if (o.type === 'gate') return this._drawGate(ctx, o);
    if (o.type === 'finish') return this._drawFinish(ctx, o);
    if (o.type === 'coin') {
      const s = Math.abs(Math.cos(this.time * 4 + o.phase));
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 15 * Math.max(0.25, s), 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      return;
    }
    if (o.type === 'ring') {
      ctx.lineWidth = 10;
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? '#ffffff' : '#ef4444';
        ctx.beginPath(); ctx.arc(o.x, o.y, 18, i * Math.PI / 2, (i + 1) * Math.PI / 2); ctx.stroke();
      }
      return;
    }
    if (o.type === 'snow') {
      ctx.fillStyle = 'rgba(248,250,252,0.85)';
      roundRect(ctx, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, 30);
      ctx.fill();
      ctx.fillStyle = 'rgba(186,230,253,0.9)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath(); ctx.arc(o.x - o.w / 2 + 12 + ((i * 37) % (o.w - 24)), o.y - o.h / 2 + 14 + ((i * 53) % (o.h - 28)), 3, 0, Math.PI * 2); ctx.fill();
      }
      const cloud = this.images.snowcloud;
      if (imgReady(cloud)) drawContain(ctx, cloud, o.x, o.y - o.h / 2 - 20, 110, 80);
      return;
    }
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);
    if (o.hit) ctx.globalAlpha = 0.5;
    if (imgReady(img)) {
      drawContain(ctx, img, 0, 0, o.w * 1.15, o.h * 1.6);
    } else if (o.type === 'log') {
      ctx.fillStyle = '#92400e';
      roundRect(ctx, -o.w / 2, -o.h / 2 + 8, o.w, o.h - 16, 16); ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.ellipse(o.w / 2 - 6, 0, 8, o.h / 2 - 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (o.type === 'rock') {
      ctx.fillStyle = '#6b7280';
      ctx.beginPath(); ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
    } else if (o.type === 'ice') {
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath(); ctx.moveTo(-o.w / 2, -8); ctx.lineTo(-10, -o.h / 2); ctx.lineTo(o.w / 2, -12); ctx.lineTo(o.w / 3, o.h / 2); ctx.lineTo(-o.w / 3, o.h / 2 - 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  _drawGate(ctx, gt) {
    const bob = Math.sin(this.time * 3 + gt.bob) * 3;
    gt.choices.forEach((text, lane) => {
      const x = laneX(lane);
      const w = LANE_W - 12;
      const y = gt.y + bob;
      let fill = '#ffffff', border = '#0c4a6e';
      if (gt.resolved) {
        if (lane === gt.correctLane) { fill = '#bbf7d0'; border = '#16a34a'; }
        else if (lane === gt.chosen) { fill = '#fecaca'; border = '#dc2626'; }
        else { fill = 'rgba(255,255,255,0.55)'; border = 'rgba(12,74,110,0.4)'; }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      roundRect(ctx, x - w / 2 + 4, y - GATE_H / 2 + 6, w, GATE_H, 16); ctx.fill();
      ctx.fillStyle = fill;
      roundRect(ctx, x - w / 2, y - GATE_H / 2, w, GATE_H, 16); ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = border;
      ctx.stroke();
      [x - w / 2, x + w / 2].forEach(bx => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(bx, y + GATE_H / 2 - 6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 9, y + GATE_H / 2 - 8, 18, 4);
      });
      let size = 21;
      let lines;
      do {
        ctx.font = `700 ${size}px Fredoka, sans-serif`;
        lines = wrapLines(ctx, text, w - 16);
        size -= 1;
      } while ((lines.length > 3 || lines.some(l => ctx.measureText(l).width > w - 12)) && size > 12);
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lh = size + 4;
      lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
    });
  }

  _drawFinish(ctx, o) {
    const y = o.y;
    const sq = 20;
    for (let x = RIVER_LEFT, i = 0; x < RIVER_RIGHT; x += sq, i++) {
      ctx.fillStyle = i % 2 ? '#111827' : '#ffffff';
      ctx.fillRect(x, y - sq, sq, sq);
      ctx.fillStyle = i % 2 ? '#ffffff' : '#111827';
      ctx.fillRect(x, y, sq, sq);
    }
    ctx.fillStyle = '#92400e';
    ctx.fillRect(RIVER_LEFT - 30, y - 34, 30, 68);
    ctx.fillRect(RIVER_RIGHT, y - 34, 30, 68);
  }

  _drawBoat(ctx) {
    const b = this.boat;
    if (b.invuln > 0 && Math.floor(b.invuln * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(b.x, BOAT_Y + Math.sin(this.time * 4) * 2);
    ctx.rotate(b.tilt);
    const img = this.images.boat;
    if (imgReady(img)) {
      drawContain(ctx, img, 0, 0, 96, 128);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(0, -56); ctx.quadraticCurveTo(34, -20, 30, 50); ctx.lineTo(-30, 50); ctx.quadraticCurveTo(-34, -20, 0, -56);
      ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, -16, -12, 32, 36, 6); ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(0, -30, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _drawFalls(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 120);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, RIVER_W, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 16; i++) {
      const x = (i * 41 + Math.sin(this.time * 2 + i) * 10) % RIVER_W;
      ctx.beginPath(); ctx.arc(x, 18 + Math.sin(this.time * 3 + i) * 6, 22, 0, Math.PI * 2); ctx.fill();
    }
  }
}
