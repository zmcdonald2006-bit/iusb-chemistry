// URL → view table. Every view is a function ({ app, main, params, query }) => cleanup?
import home from './views/home.js';
import { learnList, lectureOverview, sectionReader } from './views/learn.js';
import { practiceHub, practiceStart } from './views/practice.js';
import quiz from './views/quiz.js';
import results from './views/results.js';
import { cardsHub, cardsReview } from './views/cards.js';
import bootcamp from './views/bootcamp.js';
import reactions from './views/reactions.js';
import lab from './views/lab.js';
import reference from './views/reference.js';
import tools from './views/tools.js';
import progress from './views/progress.js';
import mistakes from './views/mistakes.js';
import settings from './views/settings.js';
import exams from './views/exams.js';
import about from './views/about.js';
import more from './views/more.js';
import notFound from './views/notfound.js';
import gameHub from './views/game.js';
import gamePlay from './views/gameplay.js';

export const ROUTES = [
  { path: '/', view: home, title: '' },
  { path: '/learn', view: learnList, title: 'Lectures' },
  { path: '/learn/:lid', view: lectureOverview },
  { path: '/learn/:lid/:sid', view: sectionReader },
  { path: '/bootcamp', view: bootcamp, title: 'Foundations Bootcamp' },
  { path: '/practice', view: practiceHub, title: 'Practice' },
  { path: '/practice/:mode', view: practiceStart, title: 'Practice' },
  { path: '/practice/:mode/:arg', view: practiceStart, title: 'Practice' },
  { path: '/quiz', view: quiz, title: 'Practice' },
  { path: '/results', view: results, title: 'Results' },
  { path: '/cards', view: cardsHub, title: 'Flashcards' },
  { path: '/cards/review', view: cardsReview, title: 'Flashcards' },
  { path: '/mistakes', view: mistakes, title: 'Mistake notebook' },
  { path: '/reactions', view: reactions, title: 'Reaction map', wide: true },
  { path: '/lab', view: lab, title: 'Name Lab' },
  { path: '/reference', view: reference, title: 'Reference' },
  { path: '/reference/:tab', view: reference, title: 'Reference' },
  { path: '/tools/:tool', view: tools, title: 'Tools' },
  { path: '/progress', view: progress, title: 'Progress', wide: true },
  { path: '/exams', view: exams, title: 'Exams' },
  { path: '/settings', view: settings, title: 'Settings' },
  { path: '/about', view: about, title: "What's new" },
  { path: '/more', view: more, title: 'More' },
  { path: '/game', view: gameHub, title: 'Sea Lion Splash' },
  { path: '/game/play/:deck', view: gamePlay, title: 'Sea Lion Splash' },
  { path: '*', view: notFound, title: 'Not found' },
];
