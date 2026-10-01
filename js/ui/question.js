// Renders any question type, collects the response, checks it and shows feedback.
import { h, icon, iconSvg, md, mdi, clear } from './dom.js';
import { figureView, molView } from './components.js';
import { checkAnswer, answerText } from '../quiz/checkers.js';
import { renderMolecule } from '../chem/render.js';
import { makeRng } from '../lib/random.js';
import { skillById } from '../../content/course.js';
import { formulaHtml } from '../chem/condensed.js';

const LETTERS = 'ABCDEFGHIJ';
const TYPED = new Set(['num', 'text', 'formula', 'name']);

/**
 * opts:
 *   mode: 'practice' (instant feedback) | 'exam' (no feedback) | 'review' (read-only, shows result)
 *   onSubmit({ result, response, ms })   called once when answered
 *   onNext()                              called by the Next button (practice/exam)
 *   onOverride()                          student says a typed answer was right
 *   showHints, showSkill, nextLabel, review: { response, result }
 */
export function questionView(q, opts = {}) {
  const mode = opts.mode || 'practice';
  const started = Date.now();
  const card = h('div', { class: 'card q-card' });
  let response = initialResponse(q);
  let answered = false;
  let result = null;

  // display order for shuffled choice lists (stable per question id)
  const n = q.type === 'struct' || q.type === 'mc' || q.type === 'multi' ? q.choices.length : 0;
  let order = [...Array(n).keys()];
  if (q.shuffle && n) order = makeRng(`shuffle:${q.id}`).shuffle(order);

  // ---- header
  const meta = h('div', { class: 'q-meta' });
  if (opts.showSkill !== false && q.skill) {
    const sk = skillById(q.skill);
    if (sk) meta.appendChild(h('span', { class: 'chip accent' }, `L${sk.lecture.number} · ${sk.title}`));
  }
  if (q.generated) meta.appendChild(h('span', { class: 'chip', title: 'A fresh auto-generated question' }, icon('sparkle'), 'New every time'));
  if (meta.childNodes.length) card.appendChild(meta);
  card.appendChild(md(q.prompt, 'div', 'q-prompt'));

  let atomsBox = null;
  if (q.type === 'atoms') {
    atomsBox = molView({ smiles: q.figure.smiles, selectable: true, selectableAtoms: q.selectable, selected: [], toggleH: q.figure.toggleH });
    card.appendChild(h('div', { class: 'q-figure' }, atomsBox));
  } else if (q.figure) {
    const fig = figureView(q.figure);
    if (fig) card.appendChild(h('div', { class: 'q-figure' }, fig));
  }

  const body = h('div', { class: 'q-body' });
  card.appendChild(body);
  const actions = h('div', { class: 'q-actions' });
  card.appendChild(actions);
  const fbHost = h('div');
  card.appendChild(fbHost);

  const checkBtn = h('button', { type: 'button', class: 'btn grow-btn', disabled: true }, mode === 'exam' ? 'Save answer' : 'Check');
  const nextBtn = h('button', { type: 'button', class: 'btn grow-btn hidden' }, opts.nextLabel || 'Next', icon('arrowRight'));
  let hintBtn = null;
  if (q.hint && mode === 'practice' && opts.showHints !== false) {
    hintBtn = h('button', { type: 'button', class: 'btn secondary', 'aria-expanded': 'false' }, icon('bulb'), 'Hint');
    hintBtn.addEventListener('click', () => {
      const open = hintBtn.getAttribute('aria-expanded') === 'true';
      hintBtn.setAttribute('aria-expanded', String(!open));
      const existing = card.querySelector('.hint-box');
      if (existing) existing.remove();
      else body.after(md(q.hint, 'div', 'hint-box'));
    });
    actions.appendChild(hintBtn);
  }
  actions.appendChild(checkBtn);
  actions.appendChild(nextBtn);

  const setReady = (ready) => { checkBtn.disabled = !ready; };

  // ---- inputs per type
  const choiceButtons = [];
  function buildChoices() {
    const multi = q.type === 'multi';
    const wrap = h('div', { class: q.type === 'struct' ? 'struct-choices' : 'choices', role: multi ? 'group' : 'radiogroup' });
    order.forEach((orig, disp) => {
      const c = q.choices[orig];
      const btn = h('button', { type: 'button', class: `choice ${q.type === 'struct' ? 'struct-choice' : ''}`, 'aria-pressed': 'false', dataset: { orig: String(orig) } });
      if (multi) btn.appendChild(h('span', { class: 'check-box', html: iconSvg('check') }));
      else btn.appendChild(h('span', { class: 'key' }, LETTERS[disp]));
      if (q.type === 'struct') {
        if (c.smiles) btn.appendChild(h('div', { class: 'mol', html: renderMolecule(c.smiles, { scale: 28 }) }));
        else btn.appendChild(h('span', { class: 'nr' }, c.text));
        btn.setAttribute('aria-label', `Choice ${LETTERS[disp]}${c.text ? `: ${c.text}` : ''}`);
      } else {
        btn.appendChild(mdi(c, 'span', 'grow'));
      }
      btn.addEventListener('click', () => {
        if (answered) return;
        if (multi) {
          const on = btn.getAttribute('aria-pressed') !== 'true';
          btn.setAttribute('aria-pressed', String(on));
          response = choiceButtons.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => +b.dataset.orig);
          setReady(true);
        } else {
          choiceButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          response = orig;
          setReady(true);
        }
      });
      choiceButtons.push(btn);
      wrap.appendChild(btn);
    });
    if (multi) setReady(true);
    body.appendChild(wrap);
    if (multi) body.appendChild(h('div', { class: 'hint', style: { marginTop: '6px' } }, 'Select all that apply.'));
  }

  function buildTF() {
    const wrap = h('div', { class: 'tf', role: 'radiogroup' });
    for (const [val, label] of [[true, 'True'], [false, 'False']]) {
      const btn = h('button', { type: 'button', class: 'choice', 'aria-pressed': 'false', dataset: { val: String(val) } }, label);
      btn.addEventListener('click', () => {
        if (answered) return;
        wrap.querySelectorAll('.choice').forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        response = val;
        setReady(true);
      });
      choiceButtons.push(btn);
      wrap.appendChild(btn);
    }
    body.appendChild(wrap);
  }

  let input = null;
  function buildTyped() {
    const attrs = { class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', autocorrect: 'off', 'aria-label': 'Your answer', placeholder: q.placeholder || (q.type === 'num' ? 'Your answer' : q.type === 'formula' ? 'e.g. C4H10O' : 'Type your answer') };
    if (q.type === 'num') attrs.inputmode = 'decimal';
    input = h('input', attrs);
    const preview = q.type === 'formula' ? h('div', { class: 'formula-preview', 'aria-hidden': 'true' }) : null;
    input.addEventListener('input', () => {
      response = input.value;
      setReady(input.value.trim().length > 0);
      if (preview) preview.innerHTML = input.value ? formulaHtml(input.value.replace(/\s+/g, '')) : '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!answered && input.value.trim()) submit(); else if (answered) nextBtn.click(); }
    });
    body.appendChild(h('div', { class: 'answer-input' }, input));
    if (preview) body.appendChild(preview);
    if (q.type === 'num' && /10|×/.test(q.placeholder || '')) body.appendChild(h('div', { class: 'hint', style: { marginTop: '6px' } }, 'Scientific notation: 3.2 x 10^-5 or 3.2e-5'));
  }

  let orderPicked = [];
  function buildOrder() {
    const picked = h('div', { class: 'order-picked', 'aria-label': 'Your order' });
    const pool = h('div', { class: 'order-pool' });
    const displayOrder = makeRng(`order:${q.id}`).shuffle([...q.items.keys()]);
    const render = () => {
      clear(picked);
      if (!orderPicked.length) picked.appendChild(h('span', { class: 'faint small' }, 'Tap the items below in order…'));
      orderPicked.forEach((i, pos) => {
        const chip = h('button', { type: 'button', class: 'order-chip', title: 'Remove' }, h('span', { class: 'n' }, String(pos + 1)), mdi(q.items[i]));
        chip.addEventListener('click', () => { if (answered) return; orderPicked = orderPicked.filter((x) => x !== i); response = [...orderPicked]; render(); });
        picked.appendChild(chip);
      });
      clear(pool);
      displayOrder.forEach((i) => {
        const chip = h('button', { type: 'button', class: 'order-chip', disabled: orderPicked.includes(i) || answered }, mdi(q.items[i]));
        chip.addEventListener('click', () => { if (answered) return; orderPicked.push(i); response = [...orderPicked]; render(); });
        pool.appendChild(chip);
      });
      setReady(orderPicked.length === q.items.length);
    };
    body.appendChild(picked);
    body.appendChild(pool);
    body.renderOrder = render;
    render();
  }

  const matchSelects = [];
  function buildMatch() {
    const rightOrder = makeRng(`match:${q.id}`).shuffle([...q.right.keys()]);
    response = q.left.map(() => -1);
    q.left.forEach((l, i) => {
      const sel = h('select', { class: 'input', 'aria-label': `Match for ${l}` }, h('option', { value: '-1' }, 'Choose…'), rightOrder.map((ri) => h('option', { value: String(ri) }, q.right[ri])));
      sel.addEventListener('change', () => {
        response[i] = +sel.value;
        setReady(response.every((x) => x >= 0));
      });
      matchSelects.push(sel);
      body.appendChild(h('div', { class: 'match-row' }, mdi(l, 'div'), sel));
    });
  }

  let noneBtn = null;
  function buildAtoms() {
    response = [];
    const redraw = () => atomsBox.redraw({ selected: response });
    atomsBox.addEventListener('click', (e) => {
      const t = e.target.closest('.atom-hit');
      if (!t || answered) return;
      const a = +t.dataset.atom;
      response = response.includes(a) ? response.filter((x) => x !== a) : [...response, a];
      if (noneBtn) noneBtn.setAttribute('aria-pressed', 'false');
      redraw();
      setReady(response.length > 0);
    });
    atomsBox.addEventListener('keydown', (e) => {
      const t = e.target.closest && e.target.closest('.atom-hit');
      if (!t || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      setTimeout(() => { const again = atomsBox.querySelector(`.atom-hit[data-atom="${t.dataset.atom}"]`); if (again) again.focus(); }, 0);
    });
    atomsBox.addEventListener('redraw', () => atomsBox.redraw({ selected: response }));
    body.appendChild(h('div', { class: 'atoms-help' }, 'Tap atoms in the drawing to select them. Tap again to unselect.'));
    if (q.allowNone) {
      noneBtn = h('button', { type: 'button', class: 'btn secondary small', 'aria-pressed': 'false', style: { marginTop: '10px' } }, 'None — there are no chirality centers');
      noneBtn.addEventListener('click', () => {
        if (answered) return;
        response = [];
        redraw();
        noneBtn.setAttribute('aria-pressed', 'true');
        setReady(true);
      });
      body.appendChild(h('div', { class: 'center' }, noneBtn));
    }
  }

  switch (q.type) {
    case 'mc': case 'multi': case 'struct': buildChoices(); break;
    case 'tf': buildTF(); break;
    case 'num': case 'text': case 'formula': case 'name': buildTyped(); break;
    case 'order': buildOrder(); break;
    case 'match': buildMatch(); break;
    case 'atoms': buildAtoms(); break;
    default: body.appendChild(h('p', {}, 'Unsupported question type.'));
  }

  // ---- submit & feedback
  function submit() {
    if (answered) return;
    answered = true;
    result = checkAnswer(q, response);
    const ms = Date.now() - started;
    lock();
    if (opts.onSubmit) opts.onSubmit({ result, response, ms });
    if (mode === 'practice') showFeedback(result);
    checkBtn.classList.add('hidden');
    if (hintBtn) hintBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    nextBtn.focus({ preventScroll: true });
  }

  function lock() {
    choiceButtons.forEach((b) => { b.disabled = true; });
    if (input) input.readOnly = true;
    matchSelects.forEach((s) => { s.disabled = true; });
    if (noneBtn) noneBtn.disabled = true;
    if (body.renderOrder) body.renderOrder();
  }

  function markChoices(res) {
    if (['mc', 'struct'].includes(q.type)) {
      choiceButtons.forEach((b) => {
        const o = +b.dataset.orig;
        if (o === q.answer) b.classList.add('correct');
        else if (o === response) b.classList.add('wrong');
      });
    } else if (q.type === 'multi') {
      choiceButtons.forEach((b) => {
        const o = +b.dataset.orig;
        const picked = (response || []).includes(o);
        if (q.answer.includes(o)) b.classList.add('correct');
        else if (picked) b.classList.add('wrong');
      });
    } else if (q.type === 'tf') {
      choiceButtons.forEach((b) => {
        const v = b.dataset.val === 'true';
        if (v === q.answer) b.classList.add('correct');
        else if (v === response) b.classList.add('wrong');
      });
    } else if (q.type === 'match') {
      matchSelects.forEach((s, i) => s.closest('.match-row').classList.add(response[i] === q.answer[i] ? 'correct' : 'wrong'));
    } else if (q.type === 'atoms') {
      atomsBox.redraw({ highlight: q.answer, highlightClass: 'ok-hl', selected: response, selectable: false });
    }
    void res;
  }

  function showFeedback(res) {
    markChoices(res);
    const kind = res.correct ? 'ok' : res.status === 'close' ? 'close' : 'bad';
    const title = res.correct ? pick(['Correct!', 'Nice!', 'Yes!', 'Exactly right!']) : res.status === 'close' ? 'Almost!' : 'Not quite';
    const fb = h('div', { class: `feedback ${kind}`, role: 'status', 'aria-live': 'polite' },
      h('div', { class: 'fb-title' }, icon(res.correct ? 'check' : res.status === 'close' ? 'bulb' : 'x'), title));
    const generic = ['Correct!', 'Not quite.'];
    if (res.message && !generic.includes(res.message)) fb.appendChild(md(res.message, 'div'));
    if (!res.correct) {
      if (q.type === 'name' && res.userSmiles) {
        const cmp = h('div', { class: 'fb-compare' },
          molView({ smiles: res.userSmiles, caption: 'What your name describes', scale: 30 }),
          molView({ smiles: q.name.smiles, caption: `The molecule: ${q.name.name}`, scale: 30 }));
        fb.appendChild(cmp);
      }
      const at = answerText(q);
      if (at && !['struct', 'atoms', 'mc', 'multi', 'tf'].includes(q.type)) fb.appendChild(h('div', { class: 'fb-answer' }, 'Answer: ', mdi(at)));
      if (q.type === 'atoms') fb.appendChild(h('div', { class: 'fb-answer' }, q.answer.length ? 'Correct atoms are shaded green.' : 'The answer was: none.'));
      if (res.tips && res.tips.length > 1) fb.appendChild(h('ul', {}, res.tips.slice(1).map((t) => h('li', {}, mdi(t)))));
      if (TYPED.has(q.type) && opts.onOverride) {
        const ov = h('button', { type: 'button', class: 'override' }, 'I think my answer was right — count it');
        ov.addEventListener('click', () => {
          opts.onOverride();
          fb.className = 'feedback ok';
          fb.querySelector('.fb-title').lastChild.textContent = 'Counted as correct';
          ov.remove();
        });
        fb.appendChild(ov);
      }
    }
    if (q.explain) fb.appendChild(md(q.explain, 'div', 'fb-explain'));
    clear(fbHost).appendChild(fb);
  }

  checkBtn.addEventListener('click', submit);
  nextBtn.addEventListener('click', () => opts.onNext && opts.onNext());

  // keyboard shortcuts: 1–9 pick a choice, Enter = check / next
  const onKey = (e) => {
    if (!card.isConnected) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key) && choiceButtons.length && !answered) {
      const b = choiceButtons[+e.key - 1];
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === 'Enter') {
      if (!answered && !checkBtn.disabled) { e.preventDefault(); submit(); }
      else if (answered && !nextBtn.classList.contains('hidden') && document.activeElement !== nextBtn) { e.preventDefault(); nextBtn.click(); }
    }
  };
  document.addEventListener('keydown', onKey);

  // review mode: show a finished question
  if (mode === 'review' && opts.review) {
    response = opts.review.response;
    answered = true;
    restoreResponse(opts.review.response);
    lock();
    showFeedback(opts.review.result || checkAnswer(q, response));
    actions.remove();
  }

  function restoreResponse(r) {
    if (['mc', 'struct'].includes(q.type)) choiceButtons.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.orig === r)));
    else if (q.type === 'multi') choiceButtons.forEach((b) => b.setAttribute('aria-pressed', String((r || []).includes(+b.dataset.orig))));
    else if (q.type === 'tf') choiceButtons.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.val === 'true') === r)));
    else if (input) input.value = r ?? '';
    else if (q.type === 'order') { orderPicked = [...(r || [])]; }
    else if (q.type === 'match') matchSelects.forEach((s, i) => { s.value = String((r || [])[i] ?? -1); });
  }

  return {
    el: card,
    focus() { if (input) input.focus({ preventScroll: true }); },
    destroy() { document.removeEventListener('keydown', onKey); },
    get answered() { return answered; },
  };
}

function initialResponse(q) {
  if (q.type === 'multi' || q.type === 'atoms' || q.type === 'order') return [];
  return null;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
