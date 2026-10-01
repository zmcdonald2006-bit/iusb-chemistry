// "This confused me" button: anywhere in the app, she can flag a question, note or reaction that
// didn't make sense. Reports go to the app's database (see js/state/feedback.js) so they can be fixed.
import { h, icon, mdi } from './dom.js';
import { modal, toast } from './components.js';
import { KINDS, LIMITS } from '../state/feedback.js';

let service = null; // { add(report) → 'sent' | 'saved', signedIn() }
export function setFeedbackService(s) { service = s; }

// context: an object, or a function returning one (read when the button is tapped):
// { where, item, question, given, answer }. Returns null when reports can't be delivered anywhere.
export function confusedButton(context, { label = 'This confused me', cls = '' } = {}) {
  if (!service) return null;
  return h('button', {
    type: 'button', class: `confused-btn ${cls}`.trim(),
    onclick: () => openReport(typeof context === 'function' ? context() : context),
  }, icon('confused'), label);
}

function openReport(ctx) {
  let kind = null;
  const choices = h('div', { class: 'confused-kinds', role: 'radiogroup', 'aria-label': 'What\'s confusing?' });
  const buttons = KINDS.map((k) => {
    const b = h('button', { type: 'button', class: 'chip chip-select', role: 'radio', 'aria-checked': 'false', 'aria-pressed': 'false' }, k.label);
    b.addEventListener('click', () => {
      kind = k.id;
      for (const x of buttons) { x.setAttribute('aria-pressed', String(x === b)); x.setAttribute('aria-checked', String(x === b)); }
      err.textContent = '';
    });
    choices.appendChild(b);
    return b;
  });
  const note = h('textarea', { class: 'input', rows: 3, maxlength: LIMITS.note, placeholder: 'Tell me more (optional): what did you expect, or which part lost you?', 'aria-label': 'More details (optional)' });
  const err = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '1.2em' }, role: 'alert' });
  const signedIn = service.signedIn();
  const body = h('div', { class: 'stack', style: { gap: '10px' } },
    ctx.where ? h('div', { class: 'chip', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, icon('pin'), ctx.where) : null,
    h('div', { class: 'small muted' }, 'What\'s confusing?'),
    choices, note, err,
    h('p', { class: 'small muted', style: { margin: 0 } }, mdi(signedIn
      ? 'This is sent to the person who made this app, along with the question or page, so it can be explained better.'
      : 'You\'re not signed in, so this is **saved on this device** and sent once you sign in with Google (Settings → Account).')));

  // Focus the first option, not the text box, so phones don't pop the keyboard over the choices.
  setTimeout(() => { if (buttons[0].isConnected) buttons[0].focus({ preventScroll: true }); }, 60);
  modal({
    title: 'This confused me',
    body,
    actions: [
      { label: 'Cancel', kind: 'secondary', value: null },
      {
        label: 'Send',
        onClick: async () => {
          if (!kind && !note.value.trim()) { err.textContent = 'Pick one, or write a note.'; return false; }
          const link = typeof location !== 'undefined' ? `${location.origin}${location.pathname}${ctx.hash || location.hash}` : '';
          let result = 'saved';
          try { result = await service.add({ ...ctx, kind: kind || 'other', note: note.value, link }); } catch { /* kept on the device */ }
          toast(result === 'sent' ? 'Thanks! Sent, so this can be explained better.' : 'Saved. It will be sent once you\'re signed in and online.');
          return true;
        },
      },
    ],
  });
}
