// Little synthesized sound effects (Web Audio, no files) and vibration.
//
// Vibration: Android browsers support navigator.vibrate. iPhones don't let websites vibrate,
// except that toggling a switch-style checkbox gives a light tap on iOS 18+, which we use as a
// best-effort fallback.

let ctx = null;
let master = null;
let soundOn = true;
let hapticsOn = true;

export function setSound(on) { soundOn = !!on; }
export function setHaptics(on) { hapticsOn = !!on; }

// Must be called from a tap/click (browsers only start audio after a user gesture).
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

function tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, to = null } = {}) {
  if (!soundOn || !ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise(dur, { vol = 0.15, at = 0, freq = 900 } = {}) {
  if (!soundOn || !ctx) return;
  const t0 = ctx.currentTime + at;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t0);
}

export const sfx = {
  start() { tone(523, 0.12, { type: 'triangle' }); tone(659, 0.12, { type: 'triangle', at: 0.1 }); tone(784, 0.2, { type: 'triangle', at: 0.2 }); },
  count() { tone(440, 0.09, { type: 'triangle', vol: 0.12 }); },
  lane() { noise(0.08, { vol: 0.05, freq: 1800 }); },
  fish(n = 0) { tone(880 * Math.pow(1.06, Math.min(n, 8)), 0.07, { type: 'sine', vol: 0.09 }); },
  correct(streak = 1) {
    const base = 600 + Math.min(streak, 10) * 20;
    tone(base, 0.1, { type: 'triangle', vol: 0.18 }); tone(base * 1.5, 0.18, { type: 'triangle', vol: 0.16, at: 0.08 });
    noise(0.25, { vol: 0.05, freq: 2500 });
  },
  wrong() { noise(0.3, { vol: 0.22, freq: 600 }); tone(180, 0.35, { type: 'sawtooth', vol: 0.12, to: 70 }); },
  shield() { tone(700, 0.15, { type: 'sine', vol: 0.15, to: 300 }); noise(0.2, { vol: 0.08, freq: 3000 }); },
  pickup() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.09, { type: 'triangle', vol: 0.12, at: i * 0.05 })); },
  streak() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.06, at: i * 0.06 })); },
  over() { [523, 440, 349, 262].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.14, at: i * 0.14 })); },
  best() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.14, at: i * 0.09 })); },
};

const isIOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function buzz(pattern = 15) {
  if (!hapticsOn) return;
  try {
    if (typeof navigator.vibrate === 'function') { navigator.vibrate(pattern); return; }
    if (isIOS) iosTap();
  } catch { /* ignore */ }
}

function iosTap() {
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}
