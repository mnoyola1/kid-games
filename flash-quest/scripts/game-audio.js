// ==================== AUDIO ====================
// Small synthesized sound effects (no files), so new decks never wait on assets.
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('flashQuest.muted') === '1';
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('flashQuest.muted', this.muted ? '1' : '0');
    return this.muted;
  }

  tone(freq, start, duration, { type = 'sine', gain = 0.16, slideTo } = {}) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const t = ctx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  play(name, combo = 0) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const lift = Math.min(combo, 8) * 40;
    switch (name) {
      case 'flip': this.tone(520, 0, 0.12, { type: 'triangle', slideTo: 780, gain: 0.08 }); break;
      case 'tap': this.tone(660, 0, 0.06, { type: 'triangle', gain: 0.06 }); break;
      case 'correct':
        this.tone(660 + lift, 0, 0.12, { type: 'triangle' });
        this.tone(990 + lift, 0.08, 0.18, { type: 'triangle' });
        break;
      case 'wrong': this.tone(220, 0, 0.25, { type: 'sawtooth', slideTo: 140, gain: 0.07 }); break;
      case 'match':
        this.tone(784, 0, 0.1, { type: 'square', gain: 0.06 });
        this.tone(1175, 0.07, 0.16, { type: 'square', gain: 0.06 });
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.11, 0.3, { type: 'triangle', gain: 0.12 }));
        break;
      default: break;
    }
  }
}
