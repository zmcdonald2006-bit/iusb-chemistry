import { h, icon, md, clear } from '../ui/dom.js';
import { pageHead, sectionTitle, modal } from '../ui/components.js';
import { dayKey } from '../state/store.js';
import { APP_VERSION } from '../version.js';

const ACCENTS = [['violet', 'Violet', '#6c4ddb'], ['berry', 'Berry', '#c2255c'], ['teal', 'Teal', '#0b7f72'], ['ocean', 'Ocean', '#1c63c9'], ['crimson', 'IU Crimson', '#990000'], ['sunset', 'Sunset', '#c94a0c']];

export default function settings({ app, main }) {
  const st = app.state;
  main.appendChild(pageHead({ title: 'Settings', sub: 'Make it yours, and keep your progress safe.' }));

  // Profile & appearance
  main.appendChild(sectionTitle('You'));
  const name = h('input', { class: 'input', value: st.profile.name || '', placeholder: 'Your first name', autocomplete: 'given-name', 'aria-label': 'Your name' });
  name.addEventListener('change', () => app.store.update((s) => { s.profile.name = name.value.trim().slice(0, 40); }));
  const theme = h('select', { class: 'input', 'aria-label': 'Theme' }, [['auto', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => h('option', { value: v, selected: st.profile.theme === v }, l)));
  theme.addEventListener('change', () => { app.store.update((s) => { s.profile.theme = theme.value; }); app.applyTheme(); });
  const swatches = h('div', { class: 'row wrap', style: { gap: '8px' } });
  const drawSwatches = () => {
    clear(swatches);
    for (const [id, label, color] of ACCENTS) {
      const on = (app.state.profile.accent || 'violet') === id;
      swatches.appendChild(h('button', { type: 'button', class: 'chip chip-select', 'aria-pressed': String(on), onclick: () => { app.store.update((s) => { s.profile.accent = id; }); app.applyTheme(); drawSwatches(); } }, h('span', { style: { width: '14px', height: '14px', borderRadius: '50%', background: color, display: 'inline-block' } }), label));
    }
  };
  drawSwatches();
  main.appendChild(h('div', { class: 'card' },
    h('div', { class: 'field' }, h('label', {}, 'Name'), name),
    h('div', { class: 'field' }, h('label', {}, 'Theme'), theme),
    h('div', { class: 'field', style: { marginBottom: 0 } }, h('label', {}, 'Accent color'), swatches)));

  // Study preferences
  main.appendChild(sectionTitle('Study'));
  const goal = h('select', { class: 'input', 'aria-label': 'Daily question goal' }, [10, 15, 20, 30, 40, 60].map((n) => h('option', { value: String(n), selected: st.profile.dailyGoal === n }, `${n} questions a day`)));
  goal.addEventListener('change', () => app.store.update((s) => { s.profile.dailyGoal = +goal.value; }));
  const newCards = h('select', { class: 'input', 'aria-label': 'New flashcards per day' }, [5, 10, 15, 20, 30, 50].map((n) => h('option', { value: String(n), selected: st.profile.newCardsPerDay === n }, `${n} new cards a day`)));
  newCards.addEventListener('change', () => app.store.update((s) => { s.profile.newCardsPerDay = +newCards.value; }));
  const hints = h('input', { type: 'checkbox', checked: st.profile.showHints !== false, id: 'hints' });
  hints.addEventListener('change', () => app.store.update((s) => { s.profile.showHints = hints.checked; }));
  main.appendChild(h('div', { class: 'card' },
    h('div', { class: 'field' }, h('label', {}, 'Daily goal'), goal),
    h('div', { class: 'field' }, h('label', {}, 'Flashcards'), newCards),
    h('label', { class: 'check-row', for: 'hints' }, hints, 'Show hint buttons in practice'),
    h('a', { class: 'btn secondary small', href: '#/exams', style: { marginTop: '8px' } }, icon('calendar'), 'Manage exam dates')));

  // Backup
  main.appendChild(sectionTitle('Backup & sync'));
  const last = st.meta.lastBackupAt ? new Date(st.meta.lastBackupAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'never';
  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden', 'aria-label': 'Choose a backup file' });
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f) return;
    const text = await f.text();
    fileIn.value = '';
    importFlow(app, text);
  });
  const canShare = !!(navigator.canShare && navigator.share && typeof File !== 'undefined');
  main.appendChild(h('div', { class: 'card' },
    md(`Progress is saved **on this device** (in this browser). Back it up now and then — and use a backup to move progress to another phone or laptop. Last backup: **${last}**.`),
    h('div', { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn', onclick: () => exportBackup(app) }, icon('download'), 'Download backup'),
      canShare ? h('button', { type: 'button', class: 'btn secondary', onclick: () => shareBackup(app) }, icon('share'), 'Share backup') : null,
      h('button', { type: 'button', class: 'btn secondary', onclick: () => fileIn.click() }, icon('upload'), 'Restore from file'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => pasteFlow(app) }, 'Paste backup text')),
    fileIn,
    h('p', { class: 'hint', style: { marginTop: '10px' } }, 'Using two devices? Download a backup on one, then "Restore → Merge" on the other: progress from both is combined.')));

  // Storage status
  const storageCard = h('div', { class: 'card' }, h('div', { class: 'muted small' }, 'Checking storage…'));
  main.appendChild(storageCard);
  (async () => {
    clear(storageCard);
    let persisted = null;
    try { persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch { persisted = null; }
    storageCard.appendChild(h('div', { class: 'row between wrap' },
      h('div', {}, h('div', { class: 'li-title' }, 'Storage'), h('div', { class: 'muted small' }, !app.store.storageOk ? 'This browser is blocking storage — progress is NOT being saved (private mode?).' : persisted ? 'Protected: the browser won\'t clear it automatically.' : 'Saved, but the browser may clear it if space runs low. Installing the app to your home screen helps.')),
      persisted === false && navigator.storage && navigator.storage.persist ? h('button', { type: 'button', class: 'btn small secondary', onclick: async () => { try { await navigator.storage.persist(); } catch { /* ignore */ } app.navigate('#/settings', { replace: true }); } }, 'Protect my data') : null));
    storageCard.appendChild(h('div', { class: 'hint', style: { marginTop: '10px' } }, installHint()));
  })();

  // About & danger zone
  main.appendChild(sectionTitle('About'));
  main.appendChild(h('div', { class: 'card list' },
    h('a', { class: 'list-item', href: '#/about' }, h('div', { class: 'li-icon' }, icon('sparkle')), h('div', { class: 'grow' }, h('div', { class: 'li-title' }, 'What\'s new'), h('div', { class: 'li-sub' }, `App v${APP_VERSION} · content ${app.course.contentVersion}`)), h('span', { class: 'chev' }, icon('chevRight'))),
    h('button', { type: 'button', class: 'list-item', style: { background: 'none', border: 0, width: '100%', textAlign: 'left' }, onclick: () => resetFlow(app) }, h('div', { class: 'li-icon', style: { background: 'var(--bad-soft)', color: 'var(--bad)' } }, icon('trash')), h('div', { class: 'grow' }, h('div', { class: 'li-title' }, 'Reset all progress'), h('div', { class: 'li-sub' }, 'Starts completely fresh. Download a backup first!')))));
}

function installHint() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  if (standalone) return 'Running as an installed app. 👍';
  if (ios) return 'Tip: in Safari tap Share → "Add to Home Screen" to install. Installed apps keep their data safer and work offline.';
  return 'Tip: install this app (browser menu → "Install app" / "Add to Home Screen") so it works offline and keeps its data safer.';
}

function backupName() {
  return `chem-companion-backup-${dayKey()}.json`;
}

function markBackedUp(app) {
  app.store.update((s) => { s.meta.lastBackupAt = Date.now(); }, { silent: true });
}

function exportBackup(app) {
  app.store.flush();
  const blob = new Blob([app.store.exportData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: backupName() });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  markBackedUp(app);
  app.toast('Backup downloaded.');
}

async function shareBackup(app) {
  app.store.flush();
  const file = new File([app.store.exportData()], backupName(), { type: 'application/json' });
  try {
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Chem Companion backup' });
      markBackedUp(app);
    } else exportBackup(app);
  } catch (e) {
    if (e && e.name !== 'AbortError') exportBackup(app);
  }
}

function importFlow(app, text) {
  modal({
    title: 'Restore backup',
    body: md('**Merge** combines the backup with the progress already on this device (best for syncing two devices).\n\n**Replace** throws away what\'s on this device and uses only the backup.'),
    actions: [
      { label: 'Cancel', kind: 'secondary', value: null },
      { label: 'Replace', kind: 'secondary', value: 'replace' },
      { label: 'Merge', value: 'merge' },
    ],
    onClose: (mode) => {
      if (!mode) return;
      const r = app.store.importData(text, { mode });
      if (r.ok) { app.applyTheme(); app.toast(mode === 'merge' ? 'Backup merged!' : 'Backup restored!'); app.navigate('#/', { replace: true }); }
      else app.toast(r.error || 'That backup could not be read.', { timeout: 7000 });
    },
  });
}

function pasteFlow(app) {
  const ta = h('textarea', { class: 'input', rows: '6', placeholder: 'Paste the contents of a backup file here', style: { fontFamily: 'var(--mono)', fontSize: '.8rem' } });
  modal({
    title: 'Paste backup',
    body: h('div', {}, ta),
    actions: [{ label: 'Cancel', kind: 'secondary', value: null }, { label: 'Continue', onClick: () => ta.value.trim() || false }],
    onClose: (text) => { if (text) importFlow(app, text); },
  });
}

function resetFlow(app) {
  const input = h('input', { class: 'input', placeholder: 'Type RESET', 'aria-label': 'Type RESET to confirm' });
  modal({
    title: 'Reset everything?',
    body: h('div', {}, md('This deletes **all** progress, flashcard schedules and settings on this device. It can\'t be undone (unless you have a backup).'), input),
    actions: [
      { label: 'Cancel', kind: 'secondary', value: false },
      { label: 'Reset', kind: 'danger', onClick: () => (input.value.trim().toUpperCase() === 'RESET' ? true : (app.toast('Type RESET to confirm.'), false)) },
    ],
    onClose: (ok) => { if (ok) { app.store.reset(); app.applyTheme(); location.hash = '#/'; location.reload(); } },
  });
}
