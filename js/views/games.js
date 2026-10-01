// Games hub: both study games and the one fish wallet they share.
import { h, icon } from '../ui/dom.js';
import { pageHead, sectionTitle } from '../ui/components.js';
import { fishIcon, paintScene } from './game.js';
import { gameState } from '../state/game.js';
import { dayKey } from '../state/store.js';
import { dailyRecord } from '../state/words.js';
import { dailyStreak, MAX_GUESSES } from '../game/words.js';
import { OUTFITS, THEMES } from '../../content/game.js';

export default function gamesHub({ app, main }) {
  const st = app.state;
  const g = gameState(st);
  const today = dayKey();
  const daily = dailyRecord(st, today);
  const streak = dailyStreak((g.words && g.words.days) || {}, today);
  const next = [...OUTFITS, ...THEMES].filter((x) => !g.owned.includes(x.id)).sort((a, b) => a.price - b.price)[0];

  main.appendChild(pageHead({ title: 'Games', sub: 'Study while you play. Both games pay into the same fish wallet.' }));

  // The wallet
  main.appendChild(h('a', { class: 'card card-link gh-wallet', href: '#/game?to=wardrobe' },
    h('div', { class: 'gh-wallet-fish' }, fishIcon(), h('b', {}, g.fish.toLocaleString())),
    h('div', { class: 'grow' },
      h('div', { class: 'li-title' }, 'Your fish'),
      h('div', { class: 'muted small' }, next
        ? (g.fish >= next.price ? `You can get the ${next.name.toLowerCase()} now!` : `${(next.price - g.fish).toLocaleString()} more for the ${next.name.toLowerCase()}`)
        : 'You own everything in the wardrobe!')),
    h('span', { class: 'chip' }, 'Wardrobe', icon('chevRight'))));

  main.appendChild(sectionTitle('Play'));
  const grid = h('div', { class: 'grid two' });

  // Word Splash
  const status = daily.done
    ? (daily.won ? `Today's word solved in ${daily.g.length}/${MAX_GUESSES}` : 'Today\'s word is done. Try practice words!')
    : daily.g.length ? `Today's word: ${daily.g.length} of ${MAX_GUESSES} guesses used` : 'Today\'s word is ready';
  grid.appendChild(h('a', { class: 'card card-link gh-game', href: '#/words' },
    h('div', { class: 'gh-tiles', 'aria-hidden': 'true' }, ['W', 'O', 'R', 'D'].map((ch, i) => h('span', { class: ['hit', 'near', 'miss', 'hit'][i] }, ch))),
    h('div', { class: 'li-title' }, 'Word Splash'),
    h('div', { class: 'muted small' }, 'Guess the chemistry word in 6 tries. A new word every day, plus unlimited practice.'),
    h('div', { class: 'row wrap', style: { gap: '6px', marginTop: '10px' } },
      h('span', { class: `chip ${daily.done ? 'ok' : 'accent'}` }, daily.done ? icon('check') : icon('calendar'), status),
      streak ? h('span', { class: 'chip warn' }, icon('flame'), `${streak}-day streak`) : null)));

  // Sea Lion Splash
  const thumb = h('canvas', { class: 'gh-thumb', 'aria-hidden': 'true' });
  grid.appendChild(h('a', { class: 'card card-link gh-game', href: '#/game' },
    thumb,
    h('div', { class: 'li-title' }, 'Sea Lion Splash'),
    h('div', { class: 'muted small' }, 'Swim through the ring with the right answer. Three lives, endless questions.'),
    h('div', { class: 'row wrap', style: { gap: '6px', marginTop: '10px' } },
      g.best ? h('span', { class: 'chip' }, icon('trophy'), `Best ${g.best.toLocaleString()}`) : h('span', { class: 'chip accent' }, icon('play'), 'Not played yet'))));
  main.appendChild(grid);
  requestAnimationFrame(() => paintScene(thumb, g.theme, g.outfit, 1.3, false, false));

  main.appendChild(h('p', { class: 'hint', style: { marginTop: '14px' } }, 'How fish are earned: Sea Lion Splash pays for every fish caught plus 3 per right answer. Word Splash pays 15–40 per word (more for fewer guesses), +10 without the clue, and extra for the daily word and streaks.'));
}
