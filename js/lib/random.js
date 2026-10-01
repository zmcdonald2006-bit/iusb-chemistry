// Seeded pseudo-random numbers so generated questions can be recreated exactly
// (e.g. when a missed question is saved to the mistake notebook).

export function makeRng(seed) {
  let a = (typeof seed === 'number' ? seed : hashString(String(seed))) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
    pick(arr) { return arr[Math.floor(next() * arr.length)]; },
    chance(p) { return next() < p; },
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    weighted(pairs) {
      // pairs: [[value, weight], ...]
      const total = pairs.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
      return pairs[pairs.length - 1][0];
    },
  };
  return rng;
}

export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}
