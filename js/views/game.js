// Sea Lion Splash hub: pick a deck, change speed, dress up the sea lion, pick an ocean.
import { h, icon, clear } from '../ui/dom.js';
import { sectionTitle } from '../ui/components.js';
import { GAME, OUTFITS, THEMES } from '../../content/game.js';
import { DECKS, recommendedDeck, deckById } from '../game/decks.js';
import { drawBackground, drawSeaLion, stageGeometry, drawFish } from '../game/draw.js';
import { PLAYER_X } from '../game/engine.js';
import { gameState, buyItem, equipItem } from '../state/game.js';
import { lectureById } from '../../content/course.js';

const SPEED_LABELS = [['chill', 'Chill', 'Lots of time to think'], ['normal', 'Normal', 'The classic'], ['fast', 'Fast', 'Exam pressure']];

export default function gameHub({ app, main, query = {} }) {
  const st = app.state;
  const g = gameState(st);
  const rec = recommendedDeck(st);
  const last = deckById(g.lastDeck) || rec;
  let raf = 0;
  const live = [];

  main.appendChild(h('a', { class: 'back-link', href: '#/games' }, icon('chevLeft'), 'Games'));
  // Hero: the sea lion swimming in her chosen ocean
  const hero = h('canvas', { class: 'g-hero-canvas', 'aria-hidden': 'true' });
  const fishCount = h('span', {}, String(g.fish));
  main.appendChild(h('section', { class: 'card g-hero' },
    hero,
    h('div', { class: 'g-hero-body' },
      h('h1', {}, GAME.name),
      h('p', { class: 'muted' }, GAME.tagline),
      h('div', { class: 'row wrap', style: { gap: '8px', margin: '10px 0 14px' } },
        h('span', { class: 'chip accent' }, fishIcon(), fishCount, ' fish'),
        g.best ? h('span', { class: 'chip' }, icon('trophy'), `Best ${g.best.toLocaleString()}`) : null,
        g.runs ? h('span', { class: 'chip' }, `${Math.round((g.correct / Math.max(1, g.answered)) * 100)}% right · ${g.runs} run${g.runs === 1 ? '' : 's'}`) : null),
      h('a', { class: 'btn block', href: `#/game/play/${last.id}` }, icon('play'), `Play ${last.name}`))));
  live.push(() => paintScene(hero, g.theme, g.outfit, performance.now() / 1000, true));

  // Speed
  main.appendChild(sectionTitle('Speed'));
  const seg = h('div', { class: 'g-seg', role: 'radiogroup', 'aria-label': 'Game speed' });
  const drawSeg = () => {
    clear(seg);
    for (const [id, label, sub] of SPEED_LABELS) {
      const on = (gameState(app.state).speed || 'normal') === id;
      seg.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: on ? 'on' : null, onclick: () => { app.store.update((s) => { gameState(s).speed = id; }); drawSeg(); } }, h('b', {}, label), h('small', {}, sub)));
    }
  };
  drawSeg();
  main.appendChild(seg);

  // Decks
  main.appendChild(sectionTitle('Pick a deck'));
  const grid = h('div', { class: 'grid two' });
  for (const d of DECKS) {
    const best = g.bestByDeck[d.id] || 0;
    const tags = d.lectures.length ? d.lectures.map((n) => `L${n}`).join(' · ') : 'All lectures';
    grid.appendChild(h('a', { class: `card card-link g-deck ${d.id === rec.id ? 'rec' : ''}`, href: `#/game/play/${d.id}` },
      h('div', { class: 'row between' }, h('div', { class: 'li-title' }, d.name), d.id === rec.id ? h('span', { class: 'chip accent' }, icon('bolt'), 'Best for you') : null),
      h('div', { class: 'muted small' }, d.desc),
      h('div', { class: 'row between', style: { marginTop: '10px' } },
        h('span', { class: 'chip', title: lectureTitles(d) }, tags),
        h('span', { class: 'small muted' }, best ? `Best ${best.toLocaleString()}` : 'Not played yet'))));
  }
  main.appendChild(grid);

  // Wardrobe
  const wardrobeTitle = sectionTitle('Wardrobe');
  wardrobeTitle.id = 'wardrobe';
  wardrobeTitle.style.scrollMarginTop = '70px';
  main.appendChild(wardrobeTitle);
  main.appendChild(h('p', { class: 'muted small', style: { margin: '-4px 0 10px' } }, 'Spend fish from both games here: catch fish and answer right in Sea Lion Splash, or solve words in Word Splash.'));
  const wardrobe = h('div', { class: 'grid tiles g-shop' });
  main.appendChild(wardrobe);
  const oceans = h('div', { class: 'grid tiles g-shop' });

  const shopItem = (kind, item) => {
    const gs = gameState(app.state);
    const owned = gs.owned.includes(item.id);
    const wearing = kind === 'theme' ? gs.theme === item.id : gs.outfit === item.id;
    const cv = h('canvas', { class: 'g-shop-canvas', 'aria-hidden': 'true' });
    const status = wearing ? h('span', { class: 'chip ok' }, icon('check'), kind === 'theme' ? 'Swimming here' : 'Wearing')
      : owned ? h('span', { class: 'chip' }, kind === 'theme' ? 'Swim here' : 'Wear')
        : h('span', { class: `chip ${gs.fish >= item.price ? 'accent' : ''}` }, fishIcon(), String(item.price));
    const btn = h('button', { type: 'button', class: `card g-item ${wearing ? 'on' : ''}`, 'aria-label': `${item.name}: ${wearing ? 'selected' : owned ? 'owned' : `${item.price} fish`}` }, cv, h('div', { class: 'g-item-name' }, item.name), status);
    btn.addEventListener('click', () => onItem(kind, item));
    requestAnimationFrame(() => paintScene(cv, kind === 'theme' ? item.id : gs.theme, kind === 'theme' ? gs.outfit : item.id, 1.3, false, kind !== 'theme'));
    return btn;
  };
  const drawShop = () => {
    clear(wardrobe); clear(oceans);
    OUTFITS.forEach((o) => wardrobe.appendChild(shopItem('outfit', o)));
    THEMES.forEach((o) => oceans.appendChild(shopItem('theme', o)));
    fishCount.textContent = String(gameState(app.state).fish);
  };
  const onItem = async (kind, item) => {
    const gs = gameState(app.state);
    if (gs.owned.includes(item.id)) {
      app.store.update((s) => { equipItem(s, kind, item.id); });
      drawShop();
      return;
    }
    if (gs.fish < item.price) { app.toast(`${item.name} costs ${item.price} fish — you have ${gs.fish}. Go catch some! 🐟`); return; }
    const yes = await app.confirm({ title: `Get the ${item.name.toLowerCase()}?`, text: `This costs ${item.price} of your ${gs.fish} fish.`, ok: 'Get it' });
    if (!yes) return;
    let res;
    app.store.update((s) => { res = buyItem(s, kind, item.id); if (res.ok) equipItem(s, kind, item.id); });
    if (res && res.ok) { app.confetti(); app.toast(`${item.name} unlocked!`); } else if (res) app.toast(res.error);
    drawShop();
  };

  main.appendChild(sectionTitle('Oceans'));
  main.appendChild(oceans);
  drawShop();

  // Settings
  main.appendChild(sectionTitle('Settings'));
  const toggle = (key, label, sub) => {
    const input = h('input', { type: 'checkbox', checked: gameState(app.state)[key] !== false });
    input.addEventListener('change', () => app.store.update((s) => { gameState(s)[key] = input.checked; }));
    return h('label', { class: 'check-row' }, input, h('div', {}, h('div', {}, label), sub ? h('div', { class: 'hint' }, sub) : null));
  };
  main.appendChild(h('div', { class: 'card' },
    toggle('sound', 'Sound effects'),
    toggle('haptics', 'Vibration', 'Android phones vibrate fully. iPhones only allow a light tap, on iOS 18 or newer.')));

  // How to play
  main.appendChild(sectionTitle('How to play'));
  main.appendChild(h('div', { class: 'card' }, h('ul', { class: 'g-howto' },
    h('li', {}, h('b', {}, 'Swipe up or down'), ' (or tap a lane, or use the arrow keys) to change lanes.'),
    h('li', {}, 'Each question comes with three life rings. ', h('b', {}, 'Swim through the ring with the right answer.')),
    h('li', {}, 'Wrong ring = bonk. You have ', h('b', {}, '3 lives'), ', and every miss shows the explanation and goes to your Mistakes list.'),
    h('li', {}, 'Answer in a row for a ', h('b', {}, 'combo multiplier'), '. Catch fish between questions.'),
    h('li', {}, 'Grab a ', h('b', {}, 'bubble'), ' to survive one bonk, or a ', h('b', {}, 'magnet'), ' to pull in fish.'))));

  if (query.to === 'wardrobe') requestAnimationFrame(() => wardrobeTitle.scrollIntoView({ block: 'start' }));

  // Animate the hero only (shop previews are still images)
  const loop = () => { for (const f of live) f(); raf = requestAnimationFrame(loop); };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) for (const f of live) f(); else raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function lectureTitles(d) {
  return d.lectures.map((n) => { const l = lectureById(`l${String(n).padStart(2, '0')}`); return l ? `L${n}: ${l.title}` : ''; }).join('\n');
}

export function fishIcon() {
  return h('span', { class: 'g-fish-ico', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 16"><path d="M15 8 22 3v10Z" fill="#ff9f1c"/><ellipse cx="9" cy="8" rx="8" ry="5.5" fill="#ffb938"/><circle cx="5" cy="7" r="1.3" fill="#2b1a0e"/></svg>' });
}

// Draw a little ocean scene with the sea lion (hero banner and shop previews).
export function paintScene(canvas, theme, outfit, t, animate = false, closeUp = false) {
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(60, rect.width), H = Math.max(40, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const geo = stageGeometry(W, H * 1.6, PLAYER_X);
  geo.H = H; geo.sandTop = H * 0.9; geo.sky = Math.round(H * 0.22);
  drawBackground(ctx, geo, theme, animate ? t * 0.05 : 0.3, t);
  if (closeUp) {
    drawSeaLion(ctx, W * 0.38, H * 0.62, H * 0.3, t, { outfit, swim: 0.5 });
  } else {
    const s = Math.min(H * 0.17, W * 0.09);
    const x = animate ? W * (0.3 + 0.04 * Math.sin(t * 0.7)) : W * 0.4;
    const y = H * 0.58 + Math.sin(t * 2.2) * s * 0.25;
    if (animate) for (let i = 0; i < 4; i++) drawFish(ctx, ((W * (0.55 + i * 0.16) - t * 40) % (W * 0.7) + W * 0.7) % (W * 0.7) + W * 0.45, H * (0.5 + 0.08 * Math.sin(i * 2)), s * 0.45, t);
    drawSeaLion(ctx, x, y, s, t, { outfit, tilt: Math.cos(t * 2.2) * 0.06 });
  }
}
