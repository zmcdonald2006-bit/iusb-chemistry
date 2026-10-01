// Sea Lion Splash: one run, full screen.
import { h, icon, md, mdi, clear } from '../ui/dom.js';
import { figureView, molView } from '../ui/components.js';
import { makeRng, randomSeed } from '../lib/random.js';
import { deckById, nextGameQuestion } from '../game/decks.js';
import { createRun, step, setLane, moveLane, dash, resume, endRun, summarizeRun, multiplier, PLAYER_X, MAX_LIVES } from '../game/engine.js';
import { stageGeometry, drawBackground, drawLanes, drawSeaLion, drawRing, drawRocks, drawFish, drawBubbleShield, drawMagnet, LANE_COLORS, createFx, updateFx, drawFx, bubbles, sparkles, floatText } from '../game/draw.js';
import { sfx, buzz, unlockAudio, setSound, setHaptics } from '../game/sound.js';
import { gameState, recordGameRun, fishEarned } from '../state/game.js';
import { GAME, STREAK_CHEERS, RUN_MESSAGES } from '../../content/game.js';
import { fishIcon } from './game.js';

export default function gamePlay({ app, main, params, query = {} }) {
  const deck = deckById(params.deck);
  if (!deck) {
    main.appendChild(h('div', { class: 'card' }, h('h1', {}, 'Deck not found'), h('a', { class: 'btn', href: '#/game' }, 'Back to the game')));
    return null;
  }
  const settings = gameState(app.state);
  setSound(settings.sound !== false);
  setHaptics(settings.haptics !== false);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('game-mode');
  app.setTitle(GAME.name);

  // ---- DOM ----
  const scoreEl = h('div', { class: 'g-score', 'aria-label': 'Score' }, '0');
  const multEl = h('span', { class: 'g-mult', hidden: true });
  const livesEl = h('div', { class: 'g-lives', 'aria-label': 'Lives' });
  const fishEl = h('span', {}, '0');
  const pauseBtn = h('button', { type: 'button', class: 'g-icon-btn', 'aria-label': 'Pause' }, icon('pause'));
  const hud = h('div', { class: 'g-hud' },
    pauseBtn,
    h('div', { class: 'g-hud-mid' }, scoreEl, multEl),
    h('div', { class: 'g-hud-right' }, livesEl, h('span', { class: 'g-fishcount' }, fishIcon(), fishEl)));
  const promptEl = h('div', { class: 'g-prompt' }, mdi(`**${deck.name}** — get ready…`));
  const figEl = h('div', { class: 'g-fig' });
  const card = h('div', { class: 'g-card', 'aria-live': 'polite' }, promptEl, figEl);
  const canvas = h('canvas', { class: 'g-canvas', 'aria-hidden': 'true' });
  const signs = h('div', { class: 'g-signs' });
  const overlay = h('div', { class: 'g-overlay', hidden: true });
  const dashBtn = h('button', { type: 'button', class: 'g-dash', hidden: true, 'aria-label': 'Dash: I know this one' }, icon('bolt'), h('span', {}, 'Dash'));
  const stage = h('div', { class: 'g-stage' }, canvas, signs, dashBtn, overlay);
  const root = h('div', { class: 'g-play' }, hud, card, stage);
  main.appendChild(root);

  // ---- State ----
  const rng = makeRng(randomSeed());
  const avoid = new Set();
  let run = null;
  let mode = 'ready'; // ready | countdown | play | paused | crash | over
  let committed = null;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let fishRun = 0; // fish caught in a row (rising pitch)
  const fx = createFx();
  const vis = { lane: 1, tilt: 0, hurt: 0, shake: 0, gates: [] };
  let geo = null;
  let dpr = 1;
  const ctx = canvas.getContext('2d');

  const resize = () => {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    geo = stageGeometry(r.width, r.height, PLAYER_X);
    placeSigns();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  renderHud();

  // ---- Overlays ----
  function showOverlay(...children) {
    clear(overlay);
    overlay.appendChild(h('div', { class: 'g-panel' }, ...children));
    overlay.hidden = false;
    setTimeout(() => { const b = overlay.querySelector('.btn'); if (b) b.focus({ preventScroll: true }); }, 30);
  }
  const hideOverlay = () => { overlay.hidden = true; clear(overlay); };

  function readyScreen() {
    showOverlay(
      h('div', { class: 'g-eyebrow' }, deck.name),
      h('h2', {}, 'Ready to dive?'),
      h('ul', { class: 'g-tips' },
        h('li', {}, h('b', {}, 'Swipe up or down'), ' (or tap a lane) to switch lanes'),
        h('li', {}, 'Swim through the ring with the ', h('b', {}, 'right answer')),
        h('li', {}, 'Know it? ', h('b', {}, 'Swipe right or tap Dash'), ' to rush the rings in for bonus points'),
        h('li', {}, 'Catch fish between questions · 3 lives')),
      h('button', { type: 'button', class: 'btn block', onclick: start }, icon('play'), 'Dive in!'),
      h('a', { class: 'btn ghost block', href: '#/game' }, 'Back'));
  }

  function start() {
    unlockAudio();
    hideOverlay();
    run = createRun({ rng, next: (r) => nextGameQuestion(deck, r, app.state, { avoid }), speed: settings.speed || 'normal' });
    renderHud();
    countdown(() => { mode = 'play'; sfx.start(); });
  }

  function countdown(done) {
    mode = 'countdown';
    let n = 3;
    const big = h('div', { class: 'g-count' }, String(n));
    overlay.hidden = false; clear(overlay); overlay.appendChild(big);
    sfx.count();
    const tick = () => {
      n--;
      if (mode !== 'countdown') return;
      if (n <= 0) { hideOverlay(); done(); return; }
      big.textContent = String(n);
      sfx.count();
      setTimeout(tick, 600);
    };
    setTimeout(tick, 600);
  }

  function pause() {
    if (mode !== 'play') return;
    mode = 'paused';
    showOverlay(
      h('h2', {}, 'Paused'),
      h('p', { class: 'muted' }, `Score ${run.score.toLocaleString()} · ${run.correct} right`),
      h('button', { type: 'button', class: 'btn block', onclick: () => { hideOverlay(); countdown(() => { mode = 'play'; }); } }, icon('play'), 'Keep swimming'),
      h('button', { type: 'button', class: 'btn secondary block', onclick: () => finish() }, 'End run & see results'),
      h('a', { class: 'btn ghost block', href: '#/game' }, 'Quit to menu'));
  }
  pauseBtn.addEventListener('click', () => { if (mode === 'play') pause(); });

  function crashScreen(e) {
    const q = e.gate.q;
    const right = q.options[q.answer];
    const picked = e.choice >= 0 ? q.options[e.choice] : null;
    const out = run.lives <= 0;
    showOverlay(
      h('div', { class: `g-eyebrow ${e.shielded ? 'ok' : 'bad'}` }, e.shielded ? 'Your bubble saved you!' : out ? 'Out of lives' : 'Bonk!'),
      h('div', { class: 'g-answer' }, h('span', { class: 'muted small' }, 'The answer:'), optionView(right, 'big')),
      picked ? h('div', { class: 'g-picked muted small' }, 'You swam through: ', optionView(picked, 'inline')) : h('div', { class: 'g-picked muted small' }, 'That lane was blocked by rocks — pick a ring next time!'),
      q.explain ? md(q.explain, 'div', 'g-explain') : null,
      h('div', { class: 'g-lives-row', 'aria-label': `${run.lives} lives left` }, hearts(run.lives)),
      h('button', { type: 'button', class: 'btn block', onclick: () => { hideOverlay(); clearSigns(); if (resume(run) === 'play') mode = 'play'; else finish(); } }, out ? 'See results' : 'Keep swimming'),
      h('div', { class: 'hint center' }, 'This question is saved in your Mistakes list.'));
  }

  function finish() {
    if (mode === 'over') return;
    mode = 'over';
    if (run) endRun(run);
    const res = commit();
    const sum = run ? summarizeRun(run) : null;
    clearSigns();
    if (!sum || !sum.answered) {
      showOverlay(h('h2', {}, 'Run ended'), h('p', { class: 'muted' }, 'No questions answered this time.'),
        h('button', { type: 'button', class: 'btn block', onclick: () => app.navigate(`#/game/play/${deck.id}?go=1`) }, 'Swim again'),
        h('a', { class: 'btn ghost block', href: '#/game' }, 'Game menu'));
      return;
    }
    const tier = sum.accuracy >= 0.85 ? 'great' : sum.accuracy >= 0.6 ? 'good' : 'rough';
    const msg = RUN_MESSAGES[tier][Math.floor(Math.random() * RUN_MESSAGES[tier].length)];
    if (res && res.newBest) { sfx.best(); app.confetti(); } else sfx.over();
    const missed = h('div', { class: 'g-missed', hidden: true },
      sum.missed.map((a) => h('details', { class: 'g-miss' },
        h('summary', {}, mdi(a.q.prompt)),
        a.q.figure ? h('div', { class: 'g-miss-fig' }, figureView(a.q.figure)) : null,
        h('div', { class: 'small' }, h('b', {}, 'Answer: '), optionView(a.q.options[a.q.answer], 'inline')),
        a.q.explain ? md(a.q.explain, 'div', 'small') : null)));
    showOverlay(
      res && res.newBest ? h('div', { class: 'g-eyebrow ok' }, icon('trophy'), 'New best!') : h('div', { class: 'g-eyebrow' }, deck.name),
      h('div', { class: 'g-final' }, sum.score.toLocaleString()),
      h('p', { class: 'center', style: { margin: '0 0 12px' } }, msg),
      h('div', { class: 'g-stats' },
        stat(`${sum.correct}/${sum.answered}`, 'right'),
        stat(String(sum.bestStreak), 'best streak'),
        stat(`+${res ? res.earned : fishEarned(sum)}`, 'fish')),
      h('button', { type: 'button', class: 'btn block', onclick: () => app.navigate(`#/game/play/${deck.id}?go=1`) }, icon('redo'), 'Swim again'),
      sum.missed.length ? h('button', { type: 'button', class: 'btn secondary block', onclick: (ev) => { missed.hidden = !missed.hidden; ev.currentTarget.textContent = missed.hidden ? `Review ${sum.missed.length} missed` : 'Hide missed'; } }, `Review ${sum.missed.length} missed`) : null,
      missed,
      h('a', { class: 'btn ghost block', href: '#/game' }, 'Game menu'));
    setTimeout(() => app.checkMilestones && app.checkMilestones(), 1200);
  }

  // Save progress once (finish, quit, leaving the page).
  function commit() {
    if (committed || !run || (!run.answers.length && !run.fish)) return committed;
    let res = null;
    app.store.update((st) => { res = recordGameRun(st, { deckId: deck.id, answers: run.answers, score: run.score, fish: run.fish, ts: Date.now() }); }, { silent: true });
    app.store.flush();
    app.refreshNav();
    committed = res;
    return res;
  }

  // ---- Signs (answer labels docked at the right of each lane) ----
  function optionView(o, size) {
    if (o.smiles) return h('span', { class: `g-opt-mol ${size}` }, molView({ smiles: o.smiles, plain: true, scale: size === 'big' ? 24 : 19 }));
    return mdi(o.label, 'span', `g-opt-text ${size}`);
  }
  function clearSigns() { clear(signs); }
  function showSigns(g) {
    clearSigns();
    g.lanes.forEach((opt, lane) => {
      const el = opt < 0
        ? h('div', { class: 'g-sign blocked', 'aria-hidden': 'true' }, icon('x'), 'Rocks')
        : h('button', { type: 'button', class: 'g-sign', 'aria-label': `Lane ${lane + 1}` }, h('span', { class: 'g-sign-dot', style: { background: LANE_COLORS[lane] } }), optionView(g.q.options[opt], 'sign'));
      el.dataset.lane = String(lane);
      if (opt >= 0) el.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (mode === 'play' && setLane(run, lane)) { sfx.lane(); buzz(8); } });
      signs.appendChild(el);
    });
    placeSigns();
  }
  function placeSigns() {
    if (!geo) return;
    for (const el of signs.children) el.style.top = `${geo.laneY[Number(el.dataset.lane)]}px`;
  }
  function markSigns(g, chosenLane, ok) {
    for (const el of signs.children) {
      const lane = Number(el.dataset.lane);
      if (lane === g.answerLane) el.classList.add('ok');
      else if (lane === chosenLane && !ok) el.classList.add('bad');
      else el.classList.add('dim');
    }
  }

  function showQuestion(q) {
    clear(promptEl); clear(figEl);
    promptEl.appendChild(mdi(q.prompt));
    const fig = q.figure ? figureView(q.figure, { plain: true, scale: 36 }) : null;
    if (fig) figEl.appendChild(fig);
    card.classList.remove('ok', 'bad');
  }

  // ---- Events from the engine ----
  function handle(events) {
    for (const e of events) {
      if (e.type === 'spawn') {
        vis.gates.push({ gate: e.gate, x: e.gate.x, state: null });
        showQuestion(e.gate.q);
        showSigns(e.gate);
        dashBtn.hidden = false;
      } else if (e.type === 'correct' || e.type === 'wrong') {
        dashBtn.hidden = true;
      }
      if (e.type === 'correct') {
        const vg = vis.gates.find((v) => v.gate === e.gate);
        if (vg) vg.state = 'ok';
        markSigns(e.gate, run.lane, true);
        card.classList.add('ok');
        const y = geo.laneY[run.lane];
        sparkles(fx, geo.px, y, '#ffe066', 16);
        floatText(fx, geo.px + geo.s * 2.2, y - geo.s * 1.4, `+${e.points}`, '#fff', 20);
        if (e.bonus) floatText(fx, geo.px + geo.s * 2.2, y - geo.s * 2.3, `⚡ speed +${e.bonus}`, '#ffe066', 14);
        sfx.correct(e.streak);
        buzz(12);
        if (e.streak % 5 === 0) {
          floatText(fx, geo.W / 2, geo.sky + geo.laneGap * 0.4, `${STREAK_CHEERS[(e.streak / 5 - 1) % STREAK_CHEERS.length]} ×${multiplier(e.streak)}`, '#ffe066', 26);
          sfx.streak();
          buzz([20, 40, 20]);
        }
        setTimeout(() => { if (!run.gate) clearSigns(); }, 650);
      } else if (e.type === 'wrong') {
        const vg = vis.gates.find((v) => v.gate === e.gate);
        if (vg) vg.state = 'bad';
        markSigns(e.gate, run.lane, false);
        card.classList.add('bad');
        mode = 'crash';
        vis.hurt = 1;
        if (!reduceMotion) vis.shake = 0.35;
        sparkles(fx, geo.px, geo.laneY[run.lane], e.shielded ? '#a5f3ff' : '#ff6b6b', 14);
        if (e.shielded) { sfx.shield(); buzz(30); } else { sfx.wrong(); buzz([70, 50, 90]); }
        fishRun = 0;
        setTimeout(() => { if (mode === 'crash') crashScreen(e); }, 450);
      } else if (e.type === 'fish') {
        fishRun++;
        sfx.fish(fishRun);
        sparkles(fx, geo.px + geo.s, geo.laneY[e.item.lane], '#ffd166', 4);
      } else if (e.type === 'pickup') {
        sfx.pickup();
        buzz(25);
        floatText(fx, geo.px + geo.s * 2, geo.laneY[run.lane] - geo.s * 1.5, e.item.kind === 'shield' ? 'Bubble shield!' : 'Fish magnet!', '#a5f3ff', 18);
      } else if (e.type === 'over') {
        finish();
      }
    }
    if (events.length) renderHud();
  }

  function renderHud() {
    scoreEl.textContent = run ? run.score.toLocaleString() : '0';
    const m = run ? multiplier(run.streak) : 1;
    multEl.hidden = m <= 1;
    multEl.textContent = `×${m}`;
    clear(livesEl);
    livesEl.append(...hearts(run ? run.lives : MAX_LIVES));
    livesEl.setAttribute('aria-label', `${run ? run.lives : MAX_LIVES} lives`);
    fishEl.textContent = String(run ? run.fish : 0);
  }

  // ---- Input ----
  const doDash = () => {
    if (mode !== 'play' || !dash(run)) return;
    dashBtn.hidden = true;
    sfx.lane();
    buzz(15);
    floatText(fx, geo.px + geo.s * 2, laneYAt(vis.lane) - geo.s * 1.6, 'Dash!', '#a5f3ff', 16);
  };
  dashBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  dashBtn.addEventListener('click', doDash);

  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (mode !== 'play' || e.target.closest('.g-panel, .g-dash')) return;
    drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    try { stage.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId || mode !== 'play') return;
    const dy = e.clientY - drag.y;
    const dx = e.clientX - drag.x;
    if (Math.abs(dy) > 24 && Math.abs(dy) >= Math.abs(dx)) {
      if (moveLane(run, dy > 0 ? 1 : -1)) { sfx.lane(); buzz(8); }
      drag.y = e.clientY;
      drag.x = e.clientX;
      drag.moved = true;
    } else if (dx > 40 && dx > Math.abs(dy) * 1.5) {
      doDash();
      drag.x = e.clientX;
      drag.moved = true;
    }
  });
  stage.addEventListener('pointerup', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved && mode === 'play' && geo) {
      const y = e.clientY - stage.getBoundingClientRect().top;
      let best = 0;
      geo.laneY.forEach((ly, i) => { if (Math.abs(ly - y) < Math.abs(geo.laneY[best] - y)) best = i; });
      if (setLane(run, best)) { sfx.lane(); buzz(8); }
    }
    drag = null;
  });
  stage.addEventListener('pointercancel', () => { drag = null; });
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (mode === 'play') {
      let handled = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (moveLane(run, -1)) sfx.lane(); }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (moveLane(run, 1)) sfx.lane(); }
      else if (['1', '2', '3'].includes(e.key)) { if (setLane(run, Number(e.key) - 1)) sfx.lane(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === 'd' || e.key === 'D') doDash();
      else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === ' ') pause();
      else handled = false;
      if (handled) e.preventDefault();
    }
  };
  window.addEventListener('keydown', onKey);
  const onVis = () => { if (document.hidden) { pause(); commitLater(); } };
  const commitLater = () => { if (run && run.answers.length) app.store.flush(); };
  document.addEventListener('visibilitychange', onVis);
  const onHide = () => { if (mode !== 'over') commit(); };
  window.addEventListener('pagehide', onHide);

  // ---- Loop ----
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;
    let dx = 0;
    if (mode === 'play' && run) {
      const d0 = run.dist;
      const events = step(run, dt);
      dx = run.dist - d0;
      handle(events);
    } else if (mode === 'ready' || mode === 'countdown') {
      dx = 0.05 * dt;
    }
    // passed rings keep drifting with the water
    for (const vg of vis.gates) { if (run && vg.gate === run.gate) vg.x = vg.gate.x; else vg.x -= dx; }
    vis.gates = vis.gates.filter((vg) => vg.x > -0.2);
    const target = run ? run.lane : 1;
    vis.lane += (target - vis.lane) * Math.min(1, dt * 13);
    vis.tilt = Math.max(-0.5, Math.min(0.5, (target - vis.lane) * 0.6));
    vis.hurt = Math.max(0, vis.hurt - dt * 1.5);
    vis.shake = Math.max(0, vis.shake - dt);
    if (geo && Math.random() < dt * 6 && mode !== 'paused') bubbles(fx, geo.px - geo.s * 1.2, laneYAt(vis.lane) + geo.s * 0.1, 1, 4);
    updateFx(fx, dt, geo ? dx * geo.W : 0);
    draw();
    raf = requestAnimationFrame(frame);
  }
  const laneYAt = (pos) => {
    const i = Math.max(0, Math.min(1.999, pos));
    const k = Math.floor(i);
    return geo.laneY[k] + (geo.laneY[Math.min(2, k + 1)] - geo.laneY[k]) * (i - k);
  };

  function draw() {
    if (!geo) return;
    const { W } = geo;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (vis.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * vis.shake, (Math.random() - 0.5) * 10 * vis.shake);
    const scroll = run ? run.dist : time * 0.05;
    const theme = gameState(app.state).theme;
    const outfit = gameState(app.state).outfit;
    drawBackground(ctx, geo, theme, scroll, time);
    drawLanes(ctx, geo, scroll);
    const r = Math.min(geo.laneGap * 0.32, geo.s * 1.9);
    // far halves of the rings and rocks
    for (const vg of vis.gates) {
      vg.gate.lanes.forEach((opt, lane) => {
        const x = vg.x * W, y = geo.laneY[lane];
        if (opt < 0) drawRocks(ctx, x, y, r * 0.8);
        else drawRing(ctx, x, y, r, LANE_COLORS[lane], 'back', vg.state && (lane === vg.gate.answerLane ? 'ok' : vg.state === 'bad' && lane === run.lane ? 'bad' : null));
      });
    }
    // fish and power-ups
    if (run) {
      for (const it of run.items) {
        const x = it.x * W, y = geo.laneY[it.lane];
        const pop = Math.min(1, (run.t - (it.born || 0)) / 0.25);
        if (it.kind === 'fish') drawFish(ctx, x, y, geo.s * 0.55, time, pop);
        else if (it.kind === 'shield') drawBubbleShield(ctx, x, y, geo.s * 0.75 * pop, time);
        else drawMagnet(ctx, x, y, geo.s * 0.75 * pop, time);
      }
    }
    // the sea lion
    const y = laneYAt(vis.lane) + geo.s * 0.18 + Math.sin(time * 4.5) * geo.s * 0.07;
    drawSeaLion(ctx, geo.px, y, geo.s, time, { outfit, tilt: vis.tilt + Math.sin(time * 4.5 + 1) * 0.03, hurt: vis.hurt });
    if (run && run.shield) drawBubbleShield(ctx, geo.px + geo.s * 0.15, y - geo.s * 0.15, geo.s * 1.75, time, 0.75);
    if (run && run.magnet > 0) {
      ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 8); ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(geo.px + geo.s * 0.3, y - geo.s * 0.1, geo.s * (1.9 + 0.1 * Math.sin(time * 6)), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // near halves of the rings
    for (const vg of vis.gates) {
      vg.gate.lanes.forEach((opt, lane) => {
        if (opt >= 0) drawRing(ctx, vg.x * W, geo.laneY[lane], r, LANE_COLORS[lane], 'front', vg.state && (lane === vg.gate.answerLane ? 'ok' : vg.state === 'bad' && lane === run.lane ? 'bad' : null));
      });
    }
    drawFx(ctx, fx);
  }

  if (query.go === '1') start(); // "Swim again" skips the intro
  else readyScreen();
  raf = requestAnimationFrame(frame);
  app.game = { run: () => run, mode: () => mode }; // for debugging in the console (window.__app.game)

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onHide);
    document.body.classList.remove('game-mode');
    if (mode !== 'over') commit();
  };
}

function hearts(n) {
  return Array.from({ length: MAX_LIVES }, (_, i) => h('span', { class: `g-heart ${i < n ? '' : 'lost'}`, html: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21Z"/></svg>' }));
}

function stat(value, label) {
  return h('div', { class: 'g-stat' }, h('b', {}, value), h('span', {}, label));
}
