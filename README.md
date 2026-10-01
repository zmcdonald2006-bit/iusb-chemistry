# Chem Companion — C102 study guide

A study app for **C102 Elementary Chemistry II at IU South Bend** (Smith, *General, Organic & Biological Chemistry*), Lectures 1–10.

It's a static web app with no build step and no dependencies. It works offline, installs to a phone's home screen, and stores progress on the device.

## What's inside

- **Learn**: notes for every lecture, with drawn structures, worked examples you reveal step by step, and quick checks inside each section.
- **Foundations Bootcamp**: rebuilds the Lecture 1–4 skills (the ones already tested) in order. Each step has a recap, a link to the notes, and a drill. A step is done at 80% mastery.
- **Practice**:
  - By lecture, by skill, mixed, weakest skills, mistakes only, or a timed practice exam.
  - Unlimited auto-generated questions for naming, drawing, reactions, chirality, pH, boiling-point order and more. The generated questions come from a built-in chemistry engine, so every answer is computed, not typed by hand.
  - Wrong answers go to a **Mistakes** notebook. A mistake leaves the notebook after she gets that question right twice.
- **Flashcards** with spaced repetition (Again / Hard / Good / Easy).
- **Sea Lion Splash**, a study game in the style of a lane-runner:
  - A sea lion swims down three lanes, and each question arrives as three life rings, one per answer. She swipes up or down (or taps a lane) and swims through the right one.
  - If she knows the answer, she can swipe right or tap **Dash** to rush the rings in for bonus points.
  - Each run has 3 lives. Misses show the explanation and go to the Mistakes notebook.
  - Fish caught along the way unlock outfits and oceans.
  - There are 11 decks, from Foundations (Lectures 1–4) to reactions and acids, all drawn from the same question generators as Practice.
  - A whole run counts toward mastery as one result per skill, scored by accuracy. Fast game answers count, but they can't outweigh careful quiz answers.
  - Chill / Normal / Fast speeds. Sound effects and vibration can be turned off in the game menu. Android phones vibrate fully; iPhones allow only a light tap, on iOS 18 or newer.
- **Name Lab**: type any compound name from class and see the structure it describes, the correct IUPAC name, the formula and the chirality centers. If a name is wrong, it explains why.
- **Reaction map**: every reaction in the course on one page, each with a Practice button.
- **Reference**: functional groups, naming rules, properties, shapes, acid–base, glossary and a pH calculator.
- **Progress**:
  - Mastery for every skill.
  - Streaks, a study heatmap, upcoming exam countdowns and milestones.
  - The home screen always suggests the next most useful thing to do.

## Where progress is saved

**On the device, always.** Progress is stored in the browser (localStorage, key `chem-companion:v1`), so the app works offline and nothing is ever lost while waiting for the internet.

**In the person's Google account, once "Sign in with Google" is turned on.**

- This is set up with a free Firebase project, about 10 minutes, in **[docs/GOOGLE_SIGN_IN.md](docs/GOOGLE_SIGN_IN.md)**.
- Signed-in people get their progress on every device. Changes sync live, and nothing is lost if they clear their browser or lose their phone.
- Each person can only read and write their own data.
- Signing in is optional. Until you paste the Firebase settings into `js/cloud/config.js`, the sign-in buttons simply don't appear.

Without signing in:

- **Each person's data is private and separate.** Anyone who opens the link gets their own progress on their own phone or laptop.
- **Settings → Backup & sync** can download or share a backup file, and restore it on another device with **Merge** (combine both) or **Replace**.
- **Install it to the home screen** (Safari: Share → *Add to Home Screen*; Chrome: *Install app*). On iPhone, Safari can clear a website's data after about 7 days without a visit, but home-screen apps are exempt.

Saved data carries a schema version, so future updates migrate old data instead of wiping it (`migrate()` in [js/state/store.js](js/state/store.js)).

## Putting it online (GitHub Pages, free)

1. Create a new repository on GitHub, for example `c102-study-guide`. It can be public or private (Pages on a private repo needs a paid plan).
2. Push this folder to it:
   ```bash
   git init && git add -A && git commit -m "Chem Companion" && git branch -M main
   git remote add origin https://github.com/<you>/c102-study-guide.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs the tests on every push. On `main` it also builds the offline cache and publishes. The site goes live at `https://<you>.github.io/c102-study-guide/`.

If the tests fail, nothing is published, so a broken update never reaches her phone.

When an update is published, open copies of the app show a **"A new version is ready. Refresh"** prompt.

## Working on it locally

You need only Ruby, which ships with macOS. No `npm install`.

```bash
ruby tools/serve.rb
```

Then open <http://localhost:8080>. The server disables caching, so edits show up on reload.

Run the tests (~490 tests: chemistry engine, every question generator × 150 seeds, content integrity, state and migrations, router):

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/run.js
```

With Node 18+ you can use `node tests/run.js` instead. You can also open <http://localhost:8080/tests/> to run the tests in a browser.

Dev pages under `tests/`:

| Page | What it shows |
|---|---|
| `gallery.html` | Every structure drawing. Add `?num=1` for numbering, `?mode=condensed` or `?mode=full` for other styles. |
| `questions.html` | Sample questions from every generator, with answers. Add `?gen=<id>`, `?seed=`, `?authored=l03` or `?wrong=1` (shows the feedback for a wrong answer). |
| `seed.html` | Fills the app with demo progress. **Overwrites your local progress.** |
| `sw-check.html?cleanup=1` | Installs the offline service worker, checks that every file got cached, then removes it. |
| `sealion.html` | Game art sheet: every outfit and ocean, a game frame and sample answer signs. |

In the browser console during a game, `__app.game.run()` shows the live game state.

The service worker is turned off on localhost by default, so reloads stay simple. To test offline mode locally, run `localStorage.setItem('cc-sw-dev','1')` in the browser console.

## Updating content

New lectures, more questions, fixed typos: see **[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)**. The short version:

1. Edit or add files in `content/lectures/`.
2. Bump `contentVersion` in [content/course.js](content/course.js) and add a `CHANGELOG` entry. She'll see a "What's new" note.
3. Run the tests.
4. Run `ruby tools/build-sw.rb` to refresh the offline file list. CI also does this when it deploys, and `ruby tools/build-sw.rb --check` tells you whether it's stale.
5. Commit and push.

**Personal touches:** the encouragement messages, milestone notes and an optional signature are in [content/messages.js](content/messages.js). The game's name, outfit and ocean names, prices in fish, and sea lion messages are in [content/game.js](content/game.js). Edit them freely, but keep the `id`s, because purchases are saved by id.

## How it's built

```
index.html            app shell (loads js/app.js)
css/app.css           all styles; light/dark themes and accent colors via CSS variables
js/app.js             startup, navigation shell, timers, onboarding, service-worker updates
js/router.js          hash router (#/learn/l03/naming) — works on any static host
js/routes.js          route table → views
js/views/             one file per screen
js/ui/                DOM helper, shared components, the question widget
js/quiz/              answer checkers, question bank, session planner, generators (gen/)
js/state/             store (save/migrate/backup/merge), spaced repetition, progress, milestones, game wallet
js/game/              Sea Lion Splash: rules (engine.js, no drawing — fully tested), decks, canvas art, sounds
js/cloud/             Sign in with Google: config.js (paste Firebase settings), sync engine, Firebase connection
js/chem/              chemistry engine: SMILES parser, ring finder, 2D layout, SVG renderer,
                      IUPAC namer, name parser + checker, reactions, molecule generator
js/lib/               seeded random numbers, safe text markup
content/              course text, questions, flashcards, reaction map, bootcamp, messages
tests/                test suite + dev pages
tools/                dev server, service-worker builder
```

- **Structures are written as SMILES** (for example `CC(C)CC` is 2-methylbutane) and drawn by the app. No image files to maintain, and every drawing matches the chemistry the answer checker uses.
- **Generated questions are seeded.** A question can be rebuilt exactly from its seed, which is how the Mistakes notebook stores generated questions.
- **Mastery** is a recency-weighted accuracy per skill that fades if a skill isn't practiced. It drives the recommendations and the Bootcamp.
- Markup in content is a small safe subset: `**bold**`, `*italic*`, `$H_2O$` formulas, `^sup^`, `~sub~`, and links to `#/…` or `https://`. Raw HTML is always escaped.

## How sign-in and sync work

- [js/cloud/sync.js](js/cloud/sync.js) keeps the device and the account's cloud copy in step:
  - each change is merged into the cloud copy within a few seconds, in a transaction;
  - changes from other devices arrive live.
- The cloud connection is pluggable. [js/cloud/firebase.js](js/cloud/firebase.js) is the real one; [js/cloud/fake.js](js/cloud/fake.js) is an in-memory version used by the tests and for trying the screens locally.
- **Merging** uses `mergeStates()` in [js/state/store.js](js/state/store.js), designed so two devices always reach the same result:
  - answer histories, sections read, exams and mistakes are combined;
  - for each setting, the latest change wins;
  - deleted exams stay deleted;
  - a reset applies everywhere.
- **Safety rules:**
  - Progress on a device that belongs to one account is never merged into another account.
  - An unfinished quiz stays on its own device.
- `tests/cloud.test.js` simulates phones and laptops syncing:
  - edits at the same time, going offline and coming back, switching accounts, resets, deleting;
  - randomized checks that merging always settles.

