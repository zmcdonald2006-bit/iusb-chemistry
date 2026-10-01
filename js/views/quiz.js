import { h, icon, clear } from '../ui/dom.js';
import { bar, emptyState } from '../ui/components.js';
import { questionView } from '../ui/question.js';
import { currentQuestion, extendSession } from '../quiz/session.js';

export default function quiz({ app, main }) {
  const session = app.state.active;
  if (!session) {
    main.appendChild(emptyState('target', 'No practice set in progress', 'Pick something to practice.', h('a', { class: 'btn', href: '#/practice' }, 'Go to practice')));
    return;
  }
  app.setTitle(session.title);
  const exam = session.mode === 'exam';
  const top = h('div', { class: 'quiz-top' });
  const host = h('div');
  main.append(top, host);
  let view = null;
  let timerId = null;

  const exit = async () => {
    const left = session.items.length - session.answers.length;
    if (!session.answers.length) {
      app.store.update((st) => { st.active = null; }, { silent: true });
      app.navigate(session.origin || '#/practice');
      return;
    }
    if (exam || left === 0) { app.finishSession(session); return; }
    const done = await app.confirm({ title: 'Take a break?', text: `You've answered ${session.answers.length} of ${session.items.length}. Your answers are saved — you can finish now or resume later from Home.`, ok: 'Finish & see results', cancel: 'Keep going' });
    if (done) app.finishSession(session);
  };

  function drawTop() {
    clear(top);
    const done = session.answers.length;
    top.appendChild(h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Exit', title: 'Exit', onclick: exit }, icon('x')));
    top.appendChild(bar(done / session.items.length));
    top.appendChild(h('span', { class: 'count' }, `${Math.min(done + 1, session.items.length)} / ${session.items.length}`));
    if (session.timeLimit) top.appendChild(h('span', { class: 'timer', id: 'quiz-timer' }));
  }

  function tick() {
    const el = document.getElementById('quiz-timer');
    if (!el) return;
    const left = Math.max(0, session.timeLimit - Math.floor((Date.now() - session.startedAt) / 1000));
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('low', left < 60);
    if (left <= 0) {
      clearInterval(timerId);
      app.toast('Time\'s up!');
      app.finishSession(session);
    }
  }

  function show() {
    if (view) view.destroy();
    clear(host);
    drawTop();
    if (session.index >= session.items.length) return finishOrExtend();
    const q = currentQuestion(session);
    if (!q) return finishOrExtend();
    const item = session.items[session.index];
    let ts = 0;
    view = questionView(q, {
      mode: exam ? 'exam' : 'practice',
      showHints: app.state.profile.showHints !== false,
      nextLabel: session.index + 1 >= session.items.length ? (session.mode === 'drill' ? 'Continue' : 'See results') : exam ? 'Next question' : 'Next',
      onSubmit: ({ result, response, ms }) => {
        ts = app.recordAnswer(session, item, q, { result, response, ms });
        const live = app.state.active;
        if (live && live.id === session.id && live !== session) Object.assign(session, live);
      },
      onOverride: () => app.overrideAnswer(session, item, q, ts),
      onNext: () => {
        // `session` is usually the same object as st.active; set (not increment) so it can't double-step
        const nextIndex = session.index + 1;
        app.store.update((st) => { if (st.active && st.active.id === session.id) st.active.index = nextIndex; }, { silent: true });
        session.index = nextIndex;
        show();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
    host.appendChild(view.el);
    if (!('ontouchstart' in window)) view.focus();
  }

  function finishOrExtend() {
    if (session.mode === 'drill') {
      const correct = session.answers.filter((a) => a.ok).length;
      const card = h('div', { class: 'card center', style: { padding: '28px 18px' } },
        h('h2', {}, `${correct} / ${session.answers.length} correct`),
        h('p', { class: 'muted' }, correct / Math.max(1, session.answers.length) >= 0.8 ? 'You\'re getting this! Keep going to lock it in, or finish.' : 'Practice makes permanent — a few more?'),
        h('div', { class: 'btn-row', style: { justifyContent: 'center' } },
          h('button', { type: 'button', class: 'btn', onclick: () => { app.store.update((st) => { if (st.active) extendSession(st, st.active, 5); }, { silent: true }); Object.assign(session, app.state.active); show(); } }, icon('plus'), '5 more'),
          h('button', { type: 'button', class: 'btn secondary', onclick: () => app.finishSession(session) }, 'Finish')));
      clear(host).appendChild(card);
      return;
    }
    app.finishSession(session);
  }

  show();
  if (session.timeLimit) { tick(); timerId = setInterval(tick, 1000); }
  return () => { if (view) view.destroy(); clearInterval(timerId); };
}
