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
- **Name Lab**: type any compound name from class and see the structure it describes, the correct IUPAC name, the formula and the chirality centers. If a name is wrong, it explains why.
- **Reaction map**: every reaction in the course on one page, each with a Practice button.
- **Reference**: functional groups, naming rules, properties, shapes, acid–base, glossary and a pH calculator.
- **Progress**:
  - Mastery for every skill.
  - Streaks, a study heatmap, upcoming exam countdowns and milestones.
  - The home screen always suggests the next most useful thing to do.

## Where progress is saved

Progress is stored **in the browser on each device** (localStorage), under the key `chem-companion:v1`. That means:

- **Each person's data is private and separate.** Anyone who opens the link gets their own progress on their own phone or laptop. Nothing is mixed, and nothing is sent anywhere.
- **Progress doesn't sync between devices on its own.** Use **Settings → Backup & sync** to:
  - download or share a backup file;
  - restore it on another device, choosing **Merge** (combine both devices) or **Replace**.
- **Install it to the home screen** (Safari: Share → *Add to Home Screen*; Chrome: *Install app*). On iPhone this matters: Safari can clear a website's stored data after about 7 days of not visiting, but home-screen apps are exempt. The app also asks the browser for persistent storage, and it reminds you to back up every couple of weeks.
- Saved data carries a schema version. Future updates migrate old data forward instead of wiping it (`migrate()` in [js/state/store.js](js/state/store.js)).

Cloud sync with accounts would need a small backend. See [Adding accounts / cloud sync](#adding-accounts--cloud-sync-later).

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

The service worker is turned off on localhost by default, so reloads stay simple. To test offline mode locally, run `localStorage.setItem('cc-sw-dev','1')` in the browser console.

## Updating content

New lectures, more questions, fixed typos: see **[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)**. The short version:

1. Edit or add files in `content/lectures/`.
2. Bump `contentVersion` in [content/course.js](content/course.js) and add a `CHANGELOG` entry. She'll see a "What's new" note.
3. Run the tests.
4. Run `ruby tools/build-sw.rb` to refresh the offline file list. CI also does this when it deploys, and `ruby tools/build-sw.rb --check` tells you whether it's stale.
5. Commit and push.

**Personal touches:** the encouragement messages, milestone notes and an optional signature are in [content/messages.js](content/messages.js). Edit them freely.

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
js/state/             store (save/migrate/backup/merge), spaced repetition, progress, milestones
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

## Adding accounts / cloud sync (later)

If several people use the app and want their progress to follow them across devices, add sign-in plus a hosted database. Keep the site on GitHub Pages. A good fit is **Supabase** (free tier, email "magic link" sign-in, Postgres with row-level security, so each user can only read and write their own row).

The app is already built for this:

- All progress is one JSON document per person.
- `mergeStates()` in [js/state/store.js](js/state/store.js) already combines two copies safely (it's what the backup **Merge** uses).
- Sync then comes down to three steps: pull the person's row → merge it with local data → push the result.
- The app keeps working offline from local data and syncs when it's back online.
