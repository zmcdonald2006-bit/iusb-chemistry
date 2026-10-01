// Word Splash: guess the chemistry word in six tries. A daily word (the same for everyone) and
// unlimited practice words, with an optional clue. Fish go into the same wallet as Sea Lion Splash.
import { h, icon, md, mdi, clear } from '../ui/dom.js';
import { modal, molView, confetti } from '../ui/components.js';
import { fishIcon, paintScene } from './game.js';
import { gameState } from '../state/game.js';
import { dayKey } from '../state/store.js';
import { wordsState, dailyRecord, practiceRecord, startPractice, useClue, addGuess } from '../state/words.js';
import { MAX_GUESSES, scoreGuess, keyStates, checkGuess, wordInfo, dailyStreak, totals, shareText, fishFor } from '../game/words.js';
import { sfx, buzz, unlockAudio, setSound, setHaptics } from '../game/sound.js';
import { lectureById, LECTURES } from '../../content/course.js';

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-']; // + = Enter, - = Backspace
const FLIP_MS = 170; // delay between tiles flipping over
const HELP_KEY = 'cc-word-help-seen';
const WIN_WORDS = ['Genius!', 'Brilliant!', 'Splendid!', 'Great!', 'Nice!', 'Phew!'];
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function wordsView({ app, main, params }) {
  const mode = params.mode === 'practice' ? 'practice' : 'daily';
  const g0 = gameState(app.state);
  setSound(g0.sound !== false);
  setHaptics(g0.haptics !== false);
  document.body.classList.add('game-mode', 'words-mode');

  let day = dayKey();
  let typed = '';
  let busy = false;
  let lastResult = null;
  let timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

  const rec = () => (mode === 'daily' ? dailyRecord(app.state, day) : practiceRecord(app.state));
  if (mode === 'practice' && !practiceRecord(app.state)) newPractice(null);

  // ---- Layout ----
  const fishNum = h('b', {}, '0');
  const root = h('div', { class: 'ws' });
  const head = h('header', { class: 'ws-head' },
    h('a', { class: 'ws-icon-btn', href: '#/games', 'aria-label': 'Back to games' }, icon('chevLeft')),
    h('div', { class: 'ws-title' }, h('b', {}, 'Word Splash'), h('span', {}, 'Guess the chemistry word')),
    h('a', { class: 'ws-fish', href: '#/game?to=wardrobe', title: 'Your fish (spend them in the wardrobe)', 'aria-label': 'Fish' }, fishIcon(), fishNum),
    h('button', { type: 'button', class: 'ws-icon-btn', 'aria-label': 'Stats', onclick: () => showStats() }, icon('chart')),
    h('button', { type: 'button', class: 'ws-icon-btn', 'aria-label': 'How to play', onclick: () => showHelp() }, icon('info')));
  const tabs = h('div', { class: 'ws-tabs', role: 'tablist' },
    h('a', { role: 'tab', href: '#/words', 'aria-selected': String(mode === 'daily'), class: mode === 'daily' ? 'on' : '' }, icon('calendar'), 'Daily word'),
    h('a', { role: 'tab', href: '#/words/practice', 'aria-selected': String(mode === 'practice'), class: mode === 'practice' ? 'on' : '' }, icon('shuffle'), 'Practice'));
  const info = h('div', { class: 'ws-info' });
  const boardWrap = h('div', { class: 'ws-board-wrap' });
  const msg = h('div', { class: 'ws-msg', role: 'status', 'aria-live': 'polite' });
  const bottom = h('div', { class: 'ws-bottom' });
  root.append(head, tabs, info, boardWrap, bottom);
  boardWrap.appendChild(msg);
  main.appendChild(root);

  let board = null;
  let rows = [];
  let keyEls = {};

  function drawAll() {
    const r = rec();
    fishNum.textContent = String(gameState(app.state).fish);
    drawInfo(r);
    drawBoard(r);
    if (r.done) showResult(r, lastResult); else drawKeyboard(r);
  }

  function drawInfo(r) {
    const w = wordInfo(r.w);
    const lec = w ? lectureById(w.lecture) : null;
    clear(info);
    const top = h('div', { class: 'ws-info-row' },
      h('span', { class: 'chip accent' }, lec ? `Lecture ${lec.number}` : 'Chemistry'),
      h('span', { class: 'chip' }, `${r.w.length} letters`));
    if (mode === 'practice') {
      const sel = h('select', { class: 'ws-select', 'aria-label': 'Words from' },
        h('option', { value: '' }, 'All lectures'),
        LECTURES.map((l) => h('option', { value: l.id }, `L${l.number}: ${l.title}`)));
      const pr = practiceRecord(app.state);
      sel.value = (pr && pr.lectures && pr.lectures[0]) || '';
      sel.addEventListener('change', async () => {
        const cur = rec();
        if (cur.g.length && !cur.done && !(await app.confirm({ title: 'Switch words?', text: 'You\'ll get a new word from these lectures. This one won\'t count.', ok: 'New word' }))) { sel.value = (cur.lectures && cur.lectures[0]) || ''; return; }
        newPractice(sel.value ? [sel.value] : null);
        typed = '';
        lastResult = null;
        drawAll();
      });
      top.appendChild(sel);
    }
    info.appendChild(top);
    if (r.done) return; // the result card explains the word
    if (r.clue) {
      info.appendChild(h('div', { class: 'ws-clue' }, icon('bulb'), h('span', {}, mdi(w ? w.clue : ''))));
    } else {
      info.appendChild(h('button', { type: 'button', class: 'ws-clue-btn', onclick: () => {
        app.store.update((st) => { useClue(st, { mode, day, ts: Date.now() }); });
        drawInfo(rec());
      } }, icon('bulb'), 'Show a clue', h('span', { class: 'muted' }, ' · solving without one pays +10 fish')));
    }
  }

  function drawBoard(r) {
    clear(boardWrap);
    boardWrap.appendChild(msg);
    const len = r.w.length;
    board = h('div', { class: 'ws-board', style: { '--len': String(len) }, role: 'grid', 'aria-label': `Guesses for a ${len}-letter word` });
    rows = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      const row = h('div', { class: 'ws-row', role: 'row' });
      const tiles = [];
      for (let j = 0; j < len; j++) { const t = h('div', { class: 'ws-tile', role: 'gridcell' }); tiles.push(t); row.appendChild(t); }
      rows.push({ row, tiles });
      board.appendChild(row);
    }
    boardWrap.appendChild(board);
    r.g.forEach((gs, i) => paintRow(i, gs, scoreGuess(gs, r.w)));
    paintTyping(r);
    fitTiles();
  }

  function paintRow(i, gs, marks, animate = false) {
    const { tiles } = rows[i];
    tiles.forEach((t, j) => {
      t.textContent = gs[j];
      t.setAttribute('aria-label', `${gs[j]}: ${{ hit: 'right spot', near: 'in the word, wrong spot', miss: 'not in the word' }[marks[j]]}`);
      t.style.setProperty('--i', String(j));
      t.className = `ws-tile ${marks[j]}${animate && !reduceMotion() ? ' flip' : ''}`;
    });
  }

  function paintTyping(r) {
    if (r.done || r.g.length >= MAX_GUESSES) return;
    const { tiles } = rows[r.g.length];
    tiles.forEach((t, j) => {
      const ch = typed[j] || '';
      t.textContent = ch;
      t.className = `ws-tile${ch ? ' filled' : ''}`;
      t.removeAttribute('aria-label');
    });
  }

  // Tiles as big as fit: by width (word length) and by the height left for the board.
  function fitTiles() {
    if (!board) return;
    const len = rec().w.length;
    const wAvail = Math.min(boardWrap.clientWidth, 520) - 8;
    const hAvail = boardWrap.clientHeight - 8;
    const gap = 6;
    const byW = (wAvail - gap * (len - 1)) / len;
    const byH = (hAvail - gap * (MAX_GUESSES - 1)) / MAX_GUESSES;
    const size = Math.max(20, Math.floor(Math.min(62, byW, byH)));
    board.style.setProperty('--tile', `${size}px`);
  }

  function drawKeyboard(r) {
    clear(bottom);
    const states = keyStates(r.g, r.w);
    keyEls = {};
    const kb = h('div', { class: 'ws-keys', role: 'group', 'aria-label': 'Keyboard' });
    for (const line of KEYS) {
      const row = h('div', { class: 'ws-keyrow' });
      for (const ch of line) {
        const isEnter = ch === '+', isBack = ch === '-';
        const k = isEnter ? 'ENTER' : isBack ? 'BACK' : ch;
        const b = h('button', { type: 'button', class: `ws-key ${isEnter || isBack ? 'wide' : ''} ${states[ch] || ''}`, 'aria-label': isEnter ? 'Enter' : isBack ? 'Delete' : ch }, isBack ? icon('backspace') : isEnter ? 'Enter' : ch);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(k); });
        b.addEventListener('click', (e) => { if (e.detail === 0) press(k); }); // keyboard/switch access
        keyEls[k] = b;
        row.appendChild(b);
      }
      kb.appendChild(row);
    }
    bottom.appendChild(kb);
  }

  function say(text, ms = 1500) {
    msg.textContent = text;
    msg.classList.add('on');
    clearTimeout(say.t);
    if (ms) say.t = setTimeout(() => msg.classList.remove('on'), ms);
  }

  function press(k) {
    unlockAudio();
    const r = rec();
    if (busy || r.done) return;
    if (k === 'ENTER') return submit();
    if (k === 'BACK') {
      if (!typed) return;
      typed = typed.slice(0, -1);
      sfx.del();
      paintTyping(r);
      return;
    }
    if (typed.length >= r.w.length) return;
    typed += k;
    sfx.key();
    buzz(5);
    paintTyping(r);
    const t = rows[r.g.length].tiles[typed.length - 1];
    if (t && !reduceMotion()) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
  }

  function submit() {
    const r = rec();
    const err = checkGuess(typed, r.w);
    if (err) {
      say(err);
      sfx.nope();
      buzz([30, 40, 30]);
      const row = rows[r.g.length].row;
      row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
      return;
    }
    const guess = typed;
    typed = '';
    busy = true;
    let res = null;
    app.store.update((st) => { res = addGuess(st, { mode, day, guess, ts: Date.now() }); });
    const after = rec();
    const i = after.g.length - 1;
    const marks = scoreGuess(guess, after.w);
    paintRow(i, guess, marks, true);
    const quick = reduceMotion();
    if (!quick) marks.forEach((m, j) => sfx.reveal(m, j));
    const total = quick ? 50 : FLIP_MS * (guess.length - 1) + 520;
    later(() => {
      busy = false;
      if (!res || !res.finished) { drawKeyboard(after); return; }
      lastResult = res;
      fishNum.textContent = String(gameState(app.state).fish);
      if (res.won) {
        say(WIN_WORDS[Math.min(after.g.length, MAX_GUESSES) - 1], 1800);
        if (!quick) rows[i].tiles.forEach((t, j) => { t.style.setProperty('--i', String(j)); t.classList.add('bounce'); });
        sfx.best();
        buzz([20, 30, 20, 30, 60]);
        if (after.g.length <= 3 || mode === 'daily') later(() => confetti(), quick ? 0 : 450);
      } else {
        say(after.w, 0);
        sfx.over();
        buzz([60, 40, 80]);
      }
      later(() => { drawInfo(after); showResult(after, res); }, quick ? 0 : 900);
    }, total);
  }

  function newPractice(lectures) {
    app.store.update((st) => { startPractice(st, { seed: `${Date.now()}:${Math.random()}`, lectures, day, ts: Date.now() }); });
  }

  // ---- Finished: what the word means, fish, and what next ----
  function showResult(r, res) {
    clear(bottom);
    const w = wordInfo(r.w) || { word: r.w, clue: '', lecture: 'l01' };
    const lec = lectureById(w.lecture);
    const ws = wordsState(app.state);
    const streak = mode === 'daily' ? dailyStreak(ws.days, day) : 0;
    const fish = r.fish != null ? r.fish : fishFor({ won: r.won, guesses: r.g.length, clue: r.clue, daily: mode === 'daily', streak });
    const scene = h('canvas', { class: 'ws-scene', 'aria-hidden': 'true' });
    const card = h('div', { class: 'ws-result' },
      h('div', { class: 'ws-result-top' },
        scene,
        h('div', { class: 'grow' },
          h('div', { class: 'ws-result-title' }, r.won ? `${WIN_WORDS[r.g.length - 1]} ${r.g.length}/${MAX_GUESSES}` : 'So close!'),
          h('div', { class: 'ws-word' }, r.w.split('').map((ch) => h('span', {}, ch))),
          h('div', { class: 'row wrap', style: { gap: '6px', marginTop: '6px' } },
            h('span', { class: 'chip accent' }, fishIcon(), `+${fish}`),
            mode === 'daily' && streak ? h('span', { class: 'chip warn' }, icon('flame'), `${streak}-day streak`) : null))),
      h('div', { class: 'ws-def' }, h('b', {}, `Lecture ${lec ? lec.number : ''}: `), mdi(w.clue)),
      w.smiles ? h('div', { class: 'ws-mol' }, molView({ smiles: w.smiles, plain: true, scale: 22 })) : null,
      h('div', { class: 'btn-row ws-actions' },
        mode === 'daily'
          ? h('a', { class: 'btn', href: '#/words/practice' }, icon('shuffle'), 'Practice words')
          : h('button', { type: 'button', class: 'btn', onclick: () => { newPractice(r.lectures || null); typed = ''; lastResult = null; drawAll(); } }, icon('redo'), 'Next word'),
        h('a', { class: 'btn secondary', href: `#/learn/${w.lecture}/${w.section || ''}`.replace(/\/$/, '') }, icon('book'), 'Notes'),
        mode === 'daily' ? h('button', { type: 'button', class: 'btn ghost', onclick: () => share(r) }, icon('share'), 'Share') : null),
      mode === 'daily' ? nextDaily() : null);
    bottom.appendChild(card);
    requestAnimationFrame(() => paintScene(scene, gameState(app.state).theme, gameState(app.state).outfit, 1.3, false, true));
    void res;
  }

  function nextDaily() {
    const el = h('div', { class: 'ws-next muted small' });
    const tick = () => {
      const now = new Date();
      const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
      const left = mid - now.getTime();
      if (dayKey() !== day) { day = dayKey(); typed = ''; lastResult = null; drawAll(); return; }
      el.textContent = `Next daily word in ${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m`;
      later(tick, 30000);
    };
    tick();
    return el;
  }

  async function share(r) {
    const text = shareText(r, { day });
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      app.toast('Copied! Paste it in a text.');
    } catch { /* cancelled */ }
  }

  function showStats() {
    const ws = wordsState(app.state);
    const t = totals(ws);
    const max = Math.max(1, ...t.d);
    const cur = rec();
    const highlight = cur.done && cur.won ? cur.g.length - 1 : -1;
    modal({
      title: 'Word Splash stats',
      body: h('div', {},
        h('div', { class: 'ws-stats' },
          stat(t.p, 'Played'), stat(t.p ? Math.round((t.w / t.p) * 100) : 0, 'Win %'),
          stat(dailyStreak(ws.days, dayKey()), 'Daily streak'), stat(ws.best || 0, 'Best streak')),
        h('div', { class: 'steps-title', style: { marginTop: '14px' } }, 'Guesses to solve'),
        h('div', { class: 'ws-dist' }, t.d.map((n, i) => h('div', { class: 'ws-dist-row' },
          h('span', {}, String(i + 1)),
          h('div', { class: `ws-bar ${i === highlight ? 'on' : ''}`, style: { width: `${Math.max(8, (n / max) * 100)}%` } }, String(n))))),
        h('p', { class: 'hint', style: { marginTop: '12px' } }, 'Daily and practice words both count. Streaks are for the daily word.')),
      actions: [{ label: 'Done', value: true }],
    });
  }
  const stat = (n, label) => h('div', {}, h('b', {}, String(n)), h('span', {}, label));

  function showHelp() {
    const ex = (word, marks) => h('div', { class: 'ws-row ws-example' }, word.split('').map((ch, i) => h('div', { class: `ws-tile ${marks[i] || 'filled'}` }, ch)));
    modal({
      title: 'How to play',
      body: h('div', { class: 'ws-help' },
        md('Guess the **chemistry word** in 6 tries. Every word is from your lectures. Type a guess and press **Enter**.'),
        h('p', {}, 'After each guess, the tiles change color:'),
        ex('ESTER', ['hit']), h('p', {}, mdi('**E** is in the word, in the right spot.')),
        ex('THIOL', ['', '', 'near']), h('p', {}, mdi('**I** is in the word, but in a different spot.')),
        ex('AMIDE', ['', '', '', 'miss']), h('p', {}, mdi('**D** is not in the word.')),
        md('Stuck? **Show a clue** (solving without one pays more). When you finish, you\'ll see what the word means and a link to the notes.\n\nThe **daily word** is new every day. **Practice** gives you unlimited words, and you can pick a lecture to review.'),
        h('p', { class: 'hint' }, 'Fish you earn here go into the same wallet as Sea Lion Splash.')),
      actions: [{ label: 'Let\'s play', value: true }],
    });
  }

  // physical keyboard
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.modal-backdrop')) return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'Enter') { e.preventDefault(); press('ENTER'); } else if (e.key === 'Backspace') { e.preventDefault(); press('BACK'); } else if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase());
  };
  document.addEventListener('keydown', onKey);
  // Re-fit the tiles whenever the space for the board changes (window size, clue shown, result card…)
  const onResize = () => fitTiles();
  window.addEventListener('resize', onResize);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => fitTiles()) : null;
  if (ro) ro.observe(boardWrap);
  const onVisible = () => { if (!document.hidden && mode === 'daily' && dayKey() !== day && !busy) { day = dayKey(); typed = ''; lastResult = null; drawAll(); } };
  document.addEventListener('visibilitychange', onVisible);

  drawAll();
  requestAnimationFrame(fitTiles);
  try { if (!localStorage.getItem(HELP_KEY)) { localStorage.setItem(HELP_KEY, '1'); later(showHelp, 300); } } catch { /* ignore */ }

  return () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    if (ro) ro.disconnect();
    document.removeEventListener('visibilitychange', onVisible);
    timers.forEach(clearTimeout);
    clearTimeout(say.t);
    document.body.classList.remove('game-mode', 'words-mode');
  };
}
