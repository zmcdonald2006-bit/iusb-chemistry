// Reusable UI pieces.
import { h, icon, iconSvg, md, mdi, clear } from './dom.js';
import { renderMolecule, renderTetrahedral } from '../chem/render.js';
import { nameCompound } from '../chem/namer.js';
import { LEVELS } from '../state/progress.js';

// ---- Progress ------------------------------------------------------------------------------

export function ring(pct, { size = 54, stroke = 6, label = null, cls = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct || 0));
  const wrap = h('div', { class: `ring ${cls}`, style: { width: `${size}px`, height: `${size}px` }, role: 'img', 'aria-label': `${Math.round(p * 100)} percent` });
  wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`;
  wrap.appendChild(h('div', { class: 'ring-label', style: { fontSize: `${Math.max(11, size * 0.24)}px` } }, label ?? `${Math.round(p * 100)}%`));
  return wrap;
}

export function bar(pct, cls = '') {
  return h('div', { class: `bar ${cls}`, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round((pct || 0) * 100)) },
    h('span', { style: { width: `${Math.round(Math.max(0, Math.min(1, pct || 0)) * 100)}%` } }));
}

export function levelChip(stats) {
  const cls = ['', 'bad', 'warn', 'info', 'ok'][stats.level] || '';
  return h('span', { class: `chip ${cls}` }, LEVELS[stats.level].label);
}

// ---- Molecules -----------------------------------------------------------------------------

export function autoNumbers(smiles) {
  const r = nameCompound(smiles);
  if (!r || !r.numbering) return null;
  return Object.fromEntries(r.numbering.map((a, i) => [a, String(i + 1)]));
}

/**
 * spec: { smiles, caption, mode, numbers ('auto' | map), highlight, toggleH, scale, plain, selectable... }
 */
export function molView(spec, extra = {}) {
  const s = typeof spec === 'string' ? { smiles: spec } : { ...spec };
  Object.assign(s, extra);
  const box = h('figure', { class: `mol-box ${s.plain ? 'plain' : ''}`, style: { margin: '0' } });
  const holder = h('div', { class: 'mol' });
  let mode = s.mode || 'skeletal';
  const draw = () => {
    const numbers = s.numbers === 'auto' ? autoNumbers(s.smiles) : s.numbers || null;
    try {
      holder.innerHTML = renderMolecule(s.smiles, {
        mode, numbers, highlight: s.highlight, highlightClass: s.highlightClass, highlightBonds: s.highlightBonds,
        selectable: s.selectable, selectableAtoms: s.selectableAtoms, selected: s.selected, scale: s.scale, title: s.title || s.caption,
      });
    } catch (e) {
      holder.textContent = 'Could not draw this structure.';
    }
  };
  draw();
  box.appendChild(holder);
  if (s.toggleH) {
    const btn = h('button', { class: 'btn ghost small mol-toggle', type: 'button', 'aria-pressed': 'false' }, icon('eye'), 'Show H');
    btn.addEventListener('click', () => {
      mode = mode === 'skeletal' ? 'condensed' : 'skeletal';
      btn.setAttribute('aria-pressed', String(mode !== 'skeletal'));
      btn.lastChild.textContent = mode === 'skeletal' ? 'Show H' : 'Hide H';
      draw();
      box.dispatchEvent(new CustomEvent('redraw', { bubbles: true }));
    });
    box.appendChild(btn);
  }
  if (s.caption) box.appendChild(mdi(s.caption, 'figcaption', 'mol-caption'));
  box.redraw = (patch) => { Object.assign(s, patch); draw(); };
  return box;
}

export function molsView(items) {
  return h('div', { class: 'mols' }, items.map((it) => molView(it)));
}

const ARROW = '<svg viewBox="0 0 76 16" aria-hidden="true"><path d="M2 8h68" stroke="currentColor" stroke-width="2" fill="none"/><path d="M64 3l7 5-7 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function rxnView({ from, reagent, to, question = false }, { scale = 30 } = {}) {
  const row = h('div', { class: 'rxn' });
  row.appendChild(molView({ smiles: from, plain: true, scale }));
  const arrow = h('div', { class: 'rxn-arrow' }, reagent ? mdi(reagent, 'div', 'reagent') : h('div', { class: 'reagent' }, ' '));
  arrow.insertAdjacentHTML('beforeend', ARROW);
  row.appendChild(arrow);
  if (to === undefined || question) row.appendChild(h('div', { class: 'q-slot', 'aria-label': 'product to predict' }, '?'));
  else {
    const list = [].concat(to || []);
    if (!list.length) row.appendChild(h('div', { class: 'nr' }, 'No reaction'));
    list.forEach((t, i) => {
      if (i) row.appendChild(h('span', { class: 'plus' }, i === 1 && list.length === 2 ? 'and' : '+'));
      row.appendChild(molView({ smiles: t, plain: true, scale }));
    });
  }
  return row;
}

export function tetraView(items, caption) {
  const wrap = h('div', { class: 'mols' });
  for (const it of items) {
    const box = h('figure', { class: 'mol-box', style: { margin: '0' } });
    box.appendChild(h('div', { class: 'mol', html: renderTetrahedral(it.groups, { mirror: it.mirror, title: it.caption }) }));
    if (it.caption) box.appendChild(mdi(it.caption, 'figcaption', 'mol-caption'));
    wrap.appendChild(box);
  }
  if (!caption) return wrap;
  return h('div', {}, wrap, mdi(caption, 'div', 'caption'));
}

// Figure for a question: {smiles}, {mols}, {rxn}, {tetras}
export function figureView(fig, opts = {}) {
  if (!fig) return null;
  if (fig.rxn) return rxnView(fig.rxn);
  if (fig.mols) return molsView(fig.mols);
  if (fig.tetras) return tetraView(fig.tetras);
  if (fig.smiles) return molView({ ...fig, ...opts });
  return null;
}

// ---- Feedback & dialogs ------------------------------------------------------------------------

let toastHost = null;
export function toast(message, { action = null, onAction = null, timeout = 3800 } = {}) {
  if (!toastHost) {
    toastHost = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(toastHost);
  }
  const el = h('div', { class: 'toast' }, h('div', { class: 'grow' }, message));
  let timer;
  const close = () => { clearTimeout(timer); el.remove(); };
  if (action) el.appendChild(h('button', { type: 'button', onclick: () => { close(); onAction && onAction(); } }, action));
  el.appendChild(h('button', { type: 'button', 'aria-label': 'Dismiss', onclick: close, html: iconSvg('x') }));
  toastHost.appendChild(el);
  if (timeout) timer = setTimeout(close, timeout);
  return close;
}

export function modal({ title, body, actions = [], dismissible = true, onClose = null, label = null }) {
  const prevFocus = document.activeElement;
  const backdrop = h('div', { class: 'modal-backdrop' });
  const dialog = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'Dialog' });
  if (title) dialog.appendChild(h('h2', {}, title));
  if (body) dialog.appendChild(typeof body === 'string' ? md(body) : body);
  let closed = false;
  const close = (result) => {
    if (closed) return;
    closed = true;
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (onClose) onClose(result);
  };
  if (actions.length) {
    const row = h('div', { class: 'btn-row end' });
    for (const a of actions) {
      row.appendChild(h('button', { type: 'button', class: `btn ${a.kind || ''}`, onclick: async () => { const r = a.onClick ? await a.onClick() : a.value; if (r !== false) close(r ?? a.value); } }, a.label));
    }
    dialog.appendChild(row);
  }
  const onKey = (e) => {
    if (e.key === 'Escape' && dismissible) close(null);
    if (e.key === 'Tab') {
      const f = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener('keydown', onKey);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop && dismissible) close(null); });
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  setTimeout(() => {
    const first = dialog.querySelector('input, select, textarea') || dialog.querySelector('.btn:not(.secondary)') || dialog.querySelector('button');
    if (first) first.focus();
  }, 30);
  return { close, dialog };
}

export function confirmDialog({ title, text, ok = 'OK', cancel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    modal({
      title, body: text,
      actions: [{ label: cancel, kind: 'secondary', value: false }, { label: ok, kind: danger ? 'danger' : '', value: true }],
      onClose: (r) => resolve(!!r),
    });
  });
}

export function confetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const colors = ['var(--accent)', 'var(--heart)', 'var(--gold)', 'var(--ok)', 'var(--info)'];
  for (let i = 0; i < 60; i++) {
    const piece = h('i', { style: { left: `${Math.random() * 100}%`, background: colors[i % colors.length], animationDelay: `${Math.random() * 0.5}s`, transform: `rotate(${Math.random() * 360}deg)` } });
    host.appendChild(piece);
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 2600);
}

export function emptyState(iconName, title, text, action = null) {
  return h('div', { class: 'empty' }, icon(iconName), h('h3', {}, title), text ? h('p', {}, text) : null, action);
}

export function pageHead({ eyebrow, title, sub, back }) {
  return h('header', { class: 'page-head' },
    back ? h('a', { class: 'back-link', href: back.href }, icon('chevLeft'), back.label) : null,
    eyebrow ? h('div', { class: 'eyebrow' }, eyebrow) : null,
    h('h1', {}, title),
    sub ? h('p', {}, sub) : null);
}

export function sectionTitle(title, link = null) {
  return h('div', { class: 'section-title' }, h('h2', {}, title), link ? h('a', { href: link.href }, link.label) : null);
}

export { clear };
