// Numerical sanity check for the new iPad loudness lift in game-tts.js.
//
// We don't need a real MP3 here — the math is the same regardless of source.
// We synthesize a "voice-like" Float32 signal (mix of sines at typical voice
// formants), put it through the same peak+RMS normalize that getDecodedBuffer
// runs, then through the new tanh saturation, and report dB before/after.

function peak(s) { let p = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > p) p = a; } return p; }
function voiceRms(s, floor = 0.01) { let sum = 0, n = 0; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > floor) { sum += a*a; n++; } } return n ? Math.sqrt(sum/n) : 0; }
function loudnessNormalize(s, { targetRms = 0.22, peakLimit = 0.985 } = {}) {
  const r = voiceRms(s); const p = peak(s);
  if (r === 0 || p === 0) return s;
  let scale = targetRms / r;
  if (p * scale > peakLimit) scale = peakLimit / p;
  for (let i = 0; i < s.length; i++) s[i] *= scale;
  return s;
}
function ampAndSoftClip(s, drive = 2.0) {
  for (let i = 0; i < s.length; i++) s[i] = Math.tanh(drive * s[i]);
  return s;
}
function dB(x) { return x > 0 ? (20 * Math.log10(x)).toFixed(2) + ' dBFS' : '-inf dBFS'; }

const sr = 44100;
const dur = 1.5;
const n = Math.floor(sr * dur);
const sig = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const t = i / sr;
  const env = Math.exp(-((t - 0.7) ** 2) / 0.5);
  sig[i] = (
    Math.sin(2 * Math.PI * 220 * t) * 0.4 +
    Math.sin(2 * Math.PI * 660 * t) * 0.25 +
    Math.sin(2 * Math.PI * 1320 * t) * 0.15 +
    (Math.random() - 0.5) * 0.05
  ) * 0.35 * env;
}

console.log('--- raw synthetic voice signal ---');
console.log('  peak', peak(sig).toFixed(4), '=', dB(peak(sig)));
console.log('  rms ', voiceRms(sig).toFixed(4), '=', dB(voiceRms(sig)));

const stage1 = sig.slice();
loudnessNormalize(stage1, { targetRms: 0.22, peakLimit: 0.985 });
console.log('--- after peak+RMS normalize (existing pipeline) ---');
console.log('  peak', peak(stage1).toFixed(4), '=', dB(peak(stage1)));
console.log('  rms ', voiceRms(stage1).toFixed(4), '=', dB(voiceRms(stage1)));

const stage2 = stage1.slice();
ampAndSoftClip(stage2, 2.0);
console.log('--- after tanh(2.0) softclip (NEW iOS lift) ---');
console.log('  peak', peak(stage2).toFixed(4), '=', dB(peak(stage2)));
console.log('  rms ', voiceRms(stage2).toFixed(4), '=', dB(voiceRms(stage2)));

const before = voiceRms(stage1);
const after = voiceRms(stage2);
const dbLift = before > 0 ? 20 * Math.log10(after / before) : 0;
console.log(`\n>> iPad RMS lift over current pipeline: +${dbLift.toFixed(2)} dB`);
console.log(`>> Peak after softclip: ${peak(stage2).toFixed(3)} (must be < 1.0 to avoid digital clipping)`);

if (peak(stage2) >= 1.0) {
  console.error('FAIL: tanh saturation produced clipping somehow.');
  process.exit(1);
}
if (dbLift < 3) {
  console.error(`FAIL: lift only ${dbLift.toFixed(2)} dB — expected at least +3 dB.`);
  process.exit(1);
}
console.log('\nPASS — loudness lift is healthy and peak stays under 1.0.');
