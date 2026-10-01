// Sea Lion Splash artwork, drawn with the 2D canvas API (no image files).
// All sizes scale with the stage, so it stays crisp on any screen.

export const LANE_COLORS = ['#ff6b6b', '#f5a524', '#22b8a7'];

const ART = {
  bay: {
    sky: ['#6ec3f5', '#cdeeff'], orb: '#ffe27a', orbGlow: 'rgba(255,226,122,0.35)',
    far: '#78b99c', far2: '#9fd2b7', surface: '#6fd0ee',
    water: ['#2aa5d3', '#137aae', '#0b5482'], ray: 'rgba(255,255,255,0.09)',
    sand: ['#f2dca3', '#d8bb7a'], kelp: 'rgba(16,104,88,0.55)', mote: 'rgba(255,255,255,0.45)',
  },
  sunset: {
    sky: ['#ff7f6a', '#ffd49a'], orb: '#fff0c0', orbGlow: 'rgba(255,214,150,0.45)',
    far: '#5a3566', far2: '#7d4a7a', surface: '#ffa47f', pier: '#3e2347',
    water: ['#4579b8', '#2c4d8a', '#1a2c5b'], ray: 'rgba(255,190,150,0.08)',
    sand: ['#e3bb8d', '#c49668'], kelp: 'rgba(36,38,92,0.55)', mote: 'rgba(255,220,200,0.45)',
  },
  kelp: {
    sky: ['#96dcc0', '#e3fbef'], orb: '#fff6b3', orbGlow: 'rgba(255,246,179,0.35)',
    far: '#4f987a', far2: '#78bb9b', surface: '#5fd2b5',
    water: ['#1e9b86', '#126f5f', '#0a4840'], ray: 'rgba(220,255,230,0.09)',
    sand: ['#d9c690', '#b9a46c'], kelp: 'rgba(24,120,58,0.82)', denseKelp: true, mote: 'rgba(220,255,230,0.5)',
  },
  night: {
    sky: ['#081330', '#22376d'], orb: '#fff4d2', orbGlow: 'rgba(200,210,255,0.25)', stars: true,
    far: '#111c42', far2: '#18275a', surface: '#3a64ad',
    water: ['#173f72', '#0d2648', '#05122a'], ray: 'rgba(150,180,255,0.05)',
    sand: ['#43577a', '#2f3f5c'], kelp: 'rgba(8,34,58,0.85)', mote: 'rgba(140,255,230,0.75)', glow: true,
  },
};
export const themeArt = (id) => ART[id] || ART.bay;

// Stage layout (CSS pixels): sky band, three lanes, sand.
export function stageGeometry(W, H, playerX) {
  const sky = Math.round(H * 0.12);
  const sandTop = H * 0.94;
  const top = sky + H * 0.11;
  const bottom = sandTop - H * 0.09;
  const laneGap = (bottom - top) / 2;
  return {
    W, H, sky, sandTop, laneGap,
    laneY: [top, top + laneGap, bottom],
    s: Math.max(16, Math.min(laneGap * 0.34, W * 0.1)),
    px: W * playerX,
  };
}

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- Background -------------------------------------------------------------------------------
export function drawBackground(ctx, g, themeId, scroll, t) {
  const a = themeArt(themeId);
  const { W, H, sky, sandTop } = g;
  // sky
  let gr = ctx.createLinearGradient(0, 0, 0, sky);
  gr.addColorStop(0, a.sky[0]); gr.addColorStop(1, a.sky[1]);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, sky + 2);
  if (a.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 40; i++) {
      const x = ((hash(i) * W * 1.3 - scroll * W * 0.02) % W + W) % W;
      const y = hash(i + 99) * sky * 0.8;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
      ctx.globalAlpha = 0.35 + 0.5 * tw;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  // sun / moon
  const orbR = sky * 0.32;
  const ox = W * 0.8, oy = sky * 0.5;
  ctx.fillStyle = a.orbGlow; ctx.beginPath(); ctx.arc(ox, oy, orbR * 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = a.orb; ctx.beginPath(); ctx.arc(ox, oy, orbR, 0, Math.PI * 2); ctx.fill();
  if (themeId === 'night') { ctx.fillStyle = a.sky[1]; ctx.beginPath(); ctx.arc(ox + orbR * 0.45, oy - orbR * 0.2, orbR * 0.85, 0, Math.PI * 2); ctx.fill(); }
  // distant hills (two parallax layers)
  hills(ctx, W, sky, a.far2, scroll * 0.06, sky * 0.55, 0.9);
  hills(ctx, W, sky, a.far, scroll * 0.12, sky * 0.35, 1.7);
  if (a.pier) pier(ctx, W, sky, a.pier, scroll * 0.12);
  // water body
  gr = ctx.createLinearGradient(0, sky, 0, H);
  gr.addColorStop(0, a.water[0]); gr.addColorStop(0.55, a.water[1]); gr.addColorStop(1, a.water[2]);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, sky + Math.sin(x * 0.035 + t * 2.2 + scroll * W * 0.035) * 2.2);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  // surface sparkle line
  ctx.strokeStyle = a.surface; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let x = 0; x <= W + 8; x += 8) {
    const y = sky + Math.sin(x * 0.035 + t * 2.2 + scroll * W * 0.035) * 2.2;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  // light rays
  ctx.fillStyle = a.ray;
  for (let i = 0; i < 5; i++) {
    const base = ((i * 0.23 + 0.05 - scroll * 0.05) % 1.15 + 1.15) % 1.15 * W - W * 0.1;
    const sway = Math.sin(t * 0.6 + i) * W * 0.02;
    ctx.beginPath();
    ctx.moveTo(base + sway, sky);
    ctx.lineTo(base + W * 0.07 + sway, sky);
    ctx.lineTo(base + W * 0.2, sandTop);
    ctx.lineTo(base + W * 0.08, sandTop);
    ctx.closePath(); ctx.fill();
  }
  // kelp (behind the action)
  const n = a.denseKelp ? 9 : 5;
  for (let i = 0; i < n; i++) {
    const span = W * 1.4;
    const x = ((hash(i + 7) * span - scroll * W * 0.45) % span + span) % span - W * 0.2;
    const hgt = (sandTop - sky) * (0.35 + hash(i + 3) * (a.denseKelp ? 0.6 : 0.35));
    kelp(ctx, x, sandTop + 4, hgt, a.kelp, t + i, Math.max(5, g.s * 0.35));
  }
  // sand
  gr = ctx.createLinearGradient(0, sandTop - 6, 0, H);
  gr.addColorStop(0, a.sand[0]); gr.addColorStop(1, a.sand[1]);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(0, H);
  const off = scroll * W;
  for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, sandTop + Math.sin((x + off) * 0.02) * 4 + Math.sin((x + off) * 0.055) * 2);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // pebbles and shells scroll with the world
  for (let i = 0; i < 14; i++) {
    const span = W * 1.6;
    const x = ((hash(i + 50) * span - off) % span + span) % span - W * 0.1;
    const y = sandTop + 6 + hash(i + 80) * (H - sandTop - 8);
    ctx.fillStyle = i % 4 === 0 ? 'rgba(255,170,190,0.8)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x, y, 2.5 + hash(i) * 3, 1.6 + hash(i + 1) * 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // drifting motes
  ctx.fillStyle = a.mote;
  for (let i = 0; i < (a.glow ? 26 : 14); i++) {
    const x = ((hash(i + 200) * W * 1.2 - scroll * W * 0.7) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1;
    const y = sky + 8 + ((hash(i + 300) * (sandTop - sky) - t * 6 * (0.3 + hash(i))) % (sandTop - sky) + (sandTop - sky)) % (sandTop - sky);
    ctx.globalAlpha = a.glow ? 0.4 + 0.5 * Math.sin(t * 3 + i) ** 2 : 0.6;
    ctx.beginPath(); ctx.arc(x, y, a.glow ? 1.8 : 1.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function hills(ctx, W, sky, color, shift, height, freq) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, sky + 1);
  for (let x = 0; x <= W + 10; x += 10) {
    const u = (x / W + shift) * freq * Math.PI * 2;
    ctx.lineTo(x, sky - height * (0.55 + 0.25 * Math.sin(u) + 0.2 * Math.sin(u * 2.3 + 1)));
  }
  ctx.lineTo(W, sky + 1); ctx.closePath(); ctx.fill();
}

function pier(ctx, W, sky, color, shift) {
  ctx.fillStyle = color;
  const span = W * 1.5;
  const x0 = (((0.3 - shift) * W) % span + span) % span - W * 0.2;
  const len = W * 0.55;
  ctx.fillRect(x0, sky - sky * 0.42, len, sky * 0.07);
  for (let i = 0; i <= 6; i++) ctx.fillRect(x0 + (len - 4) * (i / 6), sky - sky * 0.4, 3, sky * 0.42);
}

function kelp(ctx, x, base, height, color, t, w) {
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, base);
  const segs = 8;
  let px = x;
  for (let i = 1; i <= segs; i++) {
    const y = base - (height * i) / segs;
    px = x + Math.sin(t * 1.2 + i * 0.7) * w * 0.9 * (i / segs) * 2;
    ctx.lineTo(px, y);
  }
  ctx.stroke();
  // a few leaves
  ctx.fillStyle = color;
  for (let i = 2; i < segs; i += 2) {
    const y = base - (height * i) / segs;
    const lx = x + Math.sin(t * 1.2 + i * 0.7) * w * 0.9 * (i / segs) * 2;
    const side = i % 4 === 0 ? 1 : -1;
    ctx.beginPath(); ctx.ellipse(lx + side * w * 1.1, y, w * 1.3, w * 0.45, side * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

// Faint current lines so each lane is easy to see.
export function drawLanes(ctx, g, scroll) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 18]);
  ctx.lineDashOffset = scroll * g.W;
  for (const y of g.laneY) { ctx.beginPath(); ctx.moveTo(0, y + g.s * 0.9); ctx.lineTo(g.W, y + g.s * 0.9); ctx.stroke(); }
  ctx.restore();
}

// ---- Sea lion ----------------------------------------------------------------------------------
// Side view facing right, centred on (x, y). s ≈ half the body height.
export function drawSeaLion(ctx, x, y, s, t, { outfit = 'natural', tilt = 0, hurt = 0, swim = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  const flap = Math.sin(t * 9 * swim) * 0.3;
  const dark = '#5a3620', fur = '#86542f', light = '#d1a271', snout = '#d7ad80', line = 'rgba(58,32,16,0.6)';
  ctx.lineJoin = 'round';

  // rear flippers: a little fan at the tail
  ctx.save();
  ctx.translate(-1.02, 0.06);
  ctx.rotate(flap * 0.8);
  ctx.fillStyle = dark; ctx.strokeStyle = line; ctx.lineWidth = 0.04;
  for (const a of [-0.45, 0.4]) {
    ctx.save(); ctx.rotate(Math.PI + a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.25, -0.16, 0.5, -0.13); ctx.quadraticCurveTo(0.56, 0, 0.5, 0.13); ctx.quadraticCurveTo(0.25, 0.16, 0, 0); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // far front flipper (behind the body)
  ctx.save();
  ctx.translate(0.42, 0.18);
  ctx.rotate(0.7 + flap);
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(-0.05, 0.3, 0.12, 0.34, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // body: plump teardrop with a lighter belly
  const gr = ctx.createLinearGradient(0, -0.55, 0, 0.5);
  gr.addColorStop(0, '#74472a'); gr.addColorStop(0.45, fur); gr.addColorStop(0.75, '#a87447'); gr.addColorStop(1, light);
  ctx.fillStyle = gr;
  ctx.strokeStyle = line; ctx.lineWidth = 0.05;
  ctx.beginPath();
  ctx.moveTo(-1.08, 0.06);
  ctx.bezierCurveTo(-0.9, -0.3, -0.45, -0.5, 0.05, -0.5);
  ctx.bezierCurveTo(0.4, -0.5, 0.58, -0.56, 0.72, -0.66);
  ctx.bezierCurveTo(0.95, -0.66, 1.02, -0.38, 0.98, -0.2);
  ctx.bezierCurveTo(0.94, 0.14, 0.72, 0.42, 0.3, 0.47);
  ctx.bezierCurveTo(-0.15, 0.52, -0.75, 0.4, -1.08, 0.06);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // head
  const hg = ctx.createRadialGradient(0.92, -0.72, 0.05, 1.0, -0.6, 0.38);
  hg.addColorStop(0, '#9a6539'); hg.addColorStop(1, '#7a4a2b');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(1.0, -0.6, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // snout
  ctx.fillStyle = snout;
  ctx.beginPath(); ctx.ellipse(1.3, -0.49, 0.2, 0.14, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // nose
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath(); ctx.ellipse(1.47, -0.55, 0.065, 0.045, 0.2, 0, Math.PI * 2); ctx.fill();
  // smile
  ctx.strokeStyle = '#3b2416'; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(1.26, -0.41); ctx.quadraticCurveTo(1.33, -0.35, 1.41, -0.41); ctx.stroke();
  // ear
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(0.78, -0.73, 0.06, 0.035, -0.6, 0, Math.PI * 2); ctx.fill();
  // eye (big and shiny)
  const blink = (t % 4.2) < 0.12 ? 0.12 : 1;
  ctx.fillStyle = '#1d120a';
  ctx.beginPath(); ctx.ellipse(1.08, -0.69, 0.1, 0.105 * blink, 0, 0, Math.PI * 2); ctx.fill();
  if (blink === 1) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(1.11, -0.73, 0.038, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.06, -0.65, 0.016, 0, Math.PI * 2); ctx.fill();
  }
  // blush
  ctx.fillStyle = 'rgba(255,120,140,0.42)';
  ctx.beginPath(); ctx.ellipse(1.12, -0.48, 0.085, 0.048, 0, 0, Math.PI * 2); ctx.fill();
  // whiskers
  ctx.strokeStyle = 'rgba(255,248,235,0.9)'; ctx.lineWidth = 0.022;
  for (const [dx, dy] of [[0.3, -0.08], [0.33, 0], [0.29, 0.08]]) {
    ctx.beginPath(); ctx.moveTo(1.34, -0.47); ctx.quadraticCurveTo(1.34 + dx * 0.6, -0.47 + dy * 0.4, 1.34 + dx, -0.47 + dy); ctx.stroke();
  }
  // near front flipper, paddling
  ctx.save();
  ctx.translate(0.5, 0.12);
  ctx.rotate(0.55 - flap * 1.2);
  const fg = ctx.createLinearGradient(0, 0, 0, 0.6);
  fg.addColorStop(0, '#6e4325'); fg.addColorStop(1, dark);
  ctx.fillStyle = fg; ctx.strokeStyle = line; ctx.lineWidth = 0.04;
  ctx.beginPath(); ctx.moveTo(-0.1, -0.02); ctx.quadraticCurveTo(-0.24, 0.35, -0.16, 0.62); ctx.quadraticCurveTo(-0.02, 0.68, 0.08, 0.5); ctx.quadraticCurveTo(0.14, 0.2, 0.12, -0.02); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawOutfit(ctx, outfit, t);
  if (hurt > 0) {
    ctx.globalAlpha = Math.min(0.55, hurt);
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath(); ctx.arc(1.0, -0.6, 0.37, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.05, 0, 1.05, 0.48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawOutfit(ctx, id, t) {
  // Outfits are drawn for a head at (0.98, -0.58), radius 0.31; map that onto the real head.
  ctx.save();
  ctx.translate(1.0, -0.6); ctx.scale(1.13, 1.13); ctx.translate(-0.98, 0.58);
  drawOutfitShapes(ctx, id, t);
  ctx.restore();
}

function drawOutfitShapes(ctx, id, t) {
  const hx = 0.98, hy = -0.58; // head centre; top of head ≈ hy - 0.31
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (id) {
    case 'goggles': {
      ctx.strokeStyle = '#2f3d4a'; ctx.lineWidth = 0.07;
      ctx.beginPath(); ctx.ellipse(hx - 0.02, hy - 0.12, 0.3, 0.12, -0.15, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke();
      for (const [x, y] of [[1.0, -0.84], [1.19, -0.79]]) {
        ctx.fillStyle = 'rgba(140,225,255,0.85)'; ctx.strokeStyle = '#2f3d4a'; ctx.lineWidth = 0.04;
        ctx.beginPath(); ctx.arc(x, y, 0.095, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - 0.03, y - 0.03, 0.025, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bow': {
      ctx.save(); ctx.translate(0.86, -0.88); ctx.rotate(-0.3);
      ctx.fillStyle = '#ff5fa2'; ctx.strokeStyle = '#c2185b'; ctx.lineWidth = 0.03;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.2, -0.18, s * 0.24, 0); ctx.quadraticCurveTo(s * 0.2, 0.17, 0, 0); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#e83e8c'; ctx.beginPath(); ctx.arc(0, 0, 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'party': {
      ctx.save(); ctx.translate(0.92, -0.86); ctx.rotate(-0.25);
      ctx.fillStyle = '#7c5cff'; ctx.beginPath(); ctx.moveTo(-0.17, 0.02); ctx.lineTo(0.17, 0.02); ctx.lineTo(0, -0.5); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 0.06;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-0.3, -0.05 - i * 0.13); ctx.lineTo(0.3, -0.18 - i * 0.13); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(0, -0.52, 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'shades': {
      ctx.fillStyle = '#17171c';
      ctx.beginPath(); roundRect(ctx, 0.95, -0.74, 0.24, 0.15, 0.06); ctx.fill();
      ctx.strokeStyle = '#17171c'; ctx.lineWidth = 0.04;
      ctx.beginPath(); ctx.moveTo(1.19, -0.69); ctx.lineTo(1.28, -0.66); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.95, -0.7); ctx.lineTo(0.78, -0.66); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.025;
      ctx.beginPath(); ctx.moveTo(0.99, -0.71); ctx.lineTo(1.06, -0.71); ctx.stroke();
      break;
    }
    case 'flowers': {
      const spots = [[0.74, -0.8, '#ff8fab'], [0.86, -0.88, '#ffd43b'], [1.0, -0.9, '#ff6b9a'], [1.13, -0.85, '#b197fc']];
      for (const [x, y, c] of spots) {
        ctx.fillStyle = c;
        for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05, 0.045, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#fff3bf'; ctx.beginPath(); ctx.arc(x, y, 0.035, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#51cf66';
      ctx.beginPath(); ctx.ellipse(0.8, -0.86, 0.05, 0.022, -0.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'captain': {
      ctx.save(); ctx.translate(0.97, -0.86); ctx.rotate(-0.12);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 0.025;
      ctx.beginPath(); ctx.ellipse(0, -0.05, 0.27, 0.13, 0, Math.PI, Math.PI * 2); ctx.lineTo(0.27, 0.02); ctx.lineTo(-0.27, 0.02); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1c2541'; ctx.fillRect(-0.27, -0.02, 0.54, 0.07);
      ctx.beginPath(); ctx.ellipse(0.26, 0.05, 0.16, 0.04, 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(0.06, -0.08, 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'crown': {
      ctx.save(); ctx.translate(0.95, -0.87); ctx.rotate(-0.15);
      const gr = ctx.createLinearGradient(0, -0.3, 0, 0.05);
      gr.addColorStop(0, '#fff3a3'); gr.addColorStop(1, '#e0a100');
      ctx.fillStyle = gr; ctx.strokeStyle = '#b07d00'; ctx.lineWidth = 0.025;
      ctx.beginPath(); ctx.moveTo(-0.2, 0.04); ctx.lineTo(-0.23, -0.2); ctx.lineTo(-0.1, -0.08); ctx.lineTo(0, -0.27); ctx.lineTo(0.1, -0.08); ctx.lineTo(0.23, -0.2); ctx.lineTo(0.2, 0.04); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e64980'; ctx.beginPath(); ctx.arc(0, -0.03, 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4dabf7'; ctx.beginPath(); ctx.arc(-0.12, -0.02, 0.03, 0, Math.PI * 2); ctx.arc(0.12, -0.02, 0.03, 0, Math.PI * 2); ctx.fill();
      const sp = Math.max(0, Math.sin(t * 3));
      ctx.fillStyle = `rgba(255,255,255,${sp * 0.9})`; star4(ctx, 0.16, -0.24, 0.06 * sp + 0.01);
      ctx.restore();
      break;
    }
    default: break;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function star4(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.3, y - r * 0.3); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.3, y + r * 0.3); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.3, y + r * 0.3); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.3, y - r * 0.3); ctx.closePath(); ctx.fill();
}

// ---- Rings (life buoys), rocks, fish, power-ups ------------------------------------------------
// The far (right) half is drawn behind the sea lion and the near half in front, so she swims through.
export function drawRing(ctx, x, y, r, color, half, state = null) {
  const rx = r * 0.42, w = r * 0.3;
  const from = half === 'back' ? -Math.PI / 2 : Math.PI / 2;
  const to = from + Math.PI;
  const tint = state === 'ok' ? '#2fbf71' : state === 'bad' ? '#ff4d4f' : color;
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineWidth = w + 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, from, to); ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, from, to); ctx.stroke();
  ctx.strokeStyle = tint;
  for (let k = 0; k < 4; k++) {
    const a0 = -Math.PI / 4 + (k * Math.PI) / 2 - 0.32;
    const a1 = a0 + 0.64;
    const s = Math.max(a0, from), e = Math.min(a1, to);
    const s2 = Math.max(a0 + Math.PI * 2, from), e2 = Math.min(a1 + Math.PI * 2, to);
    if (e > s) { ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, s, e); ctx.stroke(); }
    if (e2 > s2) { ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, s2, e2); ctx.stroke(); }
  }
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.ellipse(x, y, rx + w * 0.25, r + w * 0.25, 0, from + 0.3, to - 0.3); ctx.stroke();
  ctx.restore();
}

export function drawRocks(ctx, x, y, r) {
  ctx.save();
  const blobs = [[-0.2, 0.35, 0.55], [0.25, 0.4, 0.45], [0.0, -0.05, 0.5], [-0.15, -0.5, 0.38], [0.2, -0.45, 0.32]];
  for (const [dx, dy, s] of blobs) {
    const gr = ctx.createRadialGradient(x + dx * r - s * r * 0.3, y + dy * r - s * r * 0.3, 1, x + dx * r, y + dy * r, s * r);
    gr.addColorStop(0, '#8a96a8'); gr.addColorStop(1, '#4b5566');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x + dx * r, y + dy * r, s * r * 0.9, s * r * 0.75, dx, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(64,192,87,0.75)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.85, r * 0.08, r * 0.25, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawFish(ctx, x, y, s, t, pop = 1) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4 + x * 0.05) * s * 0.08);
  ctx.scale(s * pop, s * pop);
  const wig = Math.sin(t * 12 + x) * 0.18;
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath(); ctx.moveTo(0.42, 0); ctx.lineTo(0.78, -0.26 + wig); ctx.lineTo(0.72, 0); ctx.lineTo(0.78, 0.26 + wig); ctx.closePath(); ctx.fill();
  const gr = ctx.createLinearGradient(0, -0.3, 0, 0.3);
  gr.addColorStop(0, '#ffd166'); gr.addColorStop(1, '#ff9f1c');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.48, 0.27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(160,80,0,0.45)'; ctx.lineWidth = 0.05;
  ctx.beginPath(); ctx.moveTo(0.05, -0.24); ctx.quadraticCurveTo(0.12, 0, 0.05, 0.24); ctx.stroke();
  ctx.fillStyle = '#2b1a0e'; ctx.beginPath(); ctx.arc(-0.24, -0.06, 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-0.25, -0.08, 0.02, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawBubbleShield(ctx, x, y, r, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(160,230,255,0.18)'); gr.addColorStop(1, 'rgba(120,210,255,0.45)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(x, y, r * (1 + Math.sin(t * 5) * 0.03), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  ctx.restore();
}

export function drawMagnet(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * s * 0.1);
  ctx.rotate(Math.sin(t * 2) * 0.2);
  ctx.lineWidth = s * 0.32; ctx.lineCap = 'butt';
  ctx.strokeStyle = '#e03131';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.45, Math.PI, 0, true); ctx.stroke();
  ctx.strokeStyle = '#dee2e6';
  ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(-s * 0.45, -s * 0.28); ctx.moveTo(s * 0.45, 0); ctx.lineTo(s * 0.45, -s * 0.28); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  star4(ctx, x + s * 0.55, y - s * 0.55, s * 0.18 * (0.6 + 0.4 * Math.sin(t * 6)));
}

// ---- Particles (bubbles, sparkles, floating text) -----------------------------------------------
export function createFx() { return { parts: [], texts: [] }; }

export function bubbles(fx, x, y, n, spread = 6) {
  for (let i = 0; i < n; i++) fx.parts.push({ kind: 'bubble', x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, vx: -20 - Math.random() * 30, vy: -20 - Math.random() * 30, r: 1.5 + Math.random() * 3, life: 0, max: 0.8 + Math.random() * 0.7 });
}
export function sparkles(fx, x, y, color, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 120;
    fx.parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2 + Math.random() * 3, color, life: 0, max: 0.5 + Math.random() * 0.4 });
  }
}
export function floatText(fx, x, y, text, color = '#fff', size = 18) {
  fx.texts.push({ x, y, text, color, size, life: 0, max: 1.1 });
}

export function updateFx(fx, dt, scrollDx) {
  for (const p of fx.parts) {
    p.life += dt;
    p.x += (p.vx - scrollDx) * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark') { p.vx *= 0.9; p.vy = p.vy * 0.9 + 60 * dt; } else { p.vx *= 0.96; p.vy -= 10 * dt; }
  }
  fx.parts = fx.parts.filter((p) => p.life < p.max);
  for (const tx of fx.texts) { tx.life += dt; tx.y -= 34 * dt; }
  fx.texts = fx.texts.filter((tx) => tx.life < tx.max);
}

export function drawFx(ctx, fx) {
  for (const p of fx.parts) {
    const k = 1 - p.life / p.max;
    if (p.kind === 'bubble') {
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * k})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.globalAlpha = k; ctx.fillStyle = p.color; star4(ctx, p.x, p.y, p.r * 1.6); ctx.globalAlpha = 1;
    }
  }
  for (const tx of fx.texts) {
    const k = 1 - tx.life / tx.max;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.font = `800 ${tx.size}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,30,60,0.55)';
    ctx.strokeText(tx.text, tx.x, tx.y);
    ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y);
    ctx.globalAlpha = 1;
  }
}
