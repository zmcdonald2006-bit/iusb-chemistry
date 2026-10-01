# Content guide

How to add lectures, questions and flashcards. All course content lives in `content/` as plain JavaScript objects. The app and the tests read them directly, so there's nothing to compile.

**Golden rule:** after any content change, run the tests. They check every structure, every answer and every link, so mistakes get caught before she ever sees them.

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/run.js
```

`node tests/run.js` works too, as does opening `http://localhost:8080/tests/` after `ruby tools/serve.rb`.

---

## Adding a new lecture (e.g. Lecture 11)

1. **Copy a lecture file:** `content/lectures/l10.js` → `content/lectures/l11.js`. Then change `id: 'l11'` and `number: 11`, and replace the content.
2. **Register it** in [content/course.js](../content/course.js): import it and append it to `LECTURES`. Ids must be `l01, l02, …` in order.
3. **Announce it:** bump `COURSE.contentVersion` (e.g. `'2026.11.03'`) and add a `CHANGELOG` entry at the top. She'll see it as "What's new".
4. **Exam date** (optional): she can add exams in the app under *Exams*. Nothing to do in code.
5. Run the tests, then `ruby tools/build-sw.rb` (adds the new file to the offline cache). Commit and push.

Once a lecture has been on an exam, set `tested: true` on it. The tests currently expect exactly `l01`–`l04` to be tested; update that check in `tests/content.test.js` when this changes. If you want the new lecture covered by the Foundations Bootcamp, add its key skills to [content/bootcamp.js](../content/bootcamp.js).

## Lecture file shape

```js
export default {
  id: 'l11', number: 11,
  title: 'Esters and Amides',
  subtitle: 'Naming, hydrolysis, …',          // one line under the title
  chapter: 'Ch. 17.5–17.9',
  tested: false,
  summary: 'One or two sentences shown on the lecture card.',
  skills: [ /* see "Skills" */ ],
  sections: [ /* see "Sections and blocks" */ ],
  questions: [ /* see "Questions" */ ],
  cards: [ /* flashcards: { id, front, back } */ ],
  keyTerms: [ /* glossary: { term, def } */ ],
};
```

### Skills

```js
{ id: 'l11.naming', title: 'Naming esters', desc: 'alkyl alkanoate: alcohol part first, acid part -ate.' }
```

- Every question belongs to exactly one skill. Mastery, recommendations and drills are per skill.
- Ids must start with the lecture id (`l11.`).
- Each skill needs **at least 2 authored questions or a generator** (the tests enforce this). Aim for 6+ authored questions, or a generator, so practice doesn't repeat.

### Sections and blocks

```js
{ id: 'naming', title: 'Naming esters', minutes: 6, blocks: [ … ] }
```

Section ids appear in links (`#/learn/l11/naming`), so keep them short and stable. Blocks:

| `t` | Fields | Notes |
|---|---|---|
| `p` | `text` | Paragraph(s); blank line = new paragraph; `- ` lines = list |
| `h` | `text` | Sub-heading |
| `list` | `items`, `ordered?` | |
| `callout` | `kind`, `title`, `text` | `kind`: `key` (must know), `tip`, `warn` (common mistake), `exam` (exam alert), `memory` (mnemonic), `life` (real world) |
| `mol` | `smiles`, `caption?`, `numbers?`, `highlight?`, `mode?`, `toggleH?`, `scale?`, `name?` | One structure. `numbers: 'auto'` shows IUPAC numbering. `mode`: `skeletal` (default), `condensed`, `full`. `highlight`: atom indices. `name` makes the tests confirm the namer agrees |
| `mols` | `items: [mol, …]` | Several structures in a row |
| `table` | `head: [...]`, `rows: [[...]]`, `caption?` | Each row must have as many cells as `head` |
| `steps` | `title?`, `items` | Numbered "HOW TO" steps |
| `example` | `title`, `prompt`, `mol?`, `steps`, `answer` | Worked example; steps are revealed one at a time |
| `check` | `q: question` | A quick check inside the notes. It also joins the practice pool |
| `rxn` | `from`, `reagent`, `to`, `caption?` | Reaction drawing. `from`/`to` are SMILES or arrays of SMILES |
| `tetra` | `items: [{ groups: [top, left, wedge, dash], caption? }]`, `caption?` | 3-D tetrahedral drawings (chirality) |
| `compare` | `items: [{ title, text }]` | Side-by-side boxes |
| `link` | `href: '#/…'`, `text` | In-app button link |

### Text formatting (markup)

All text fields accept a small, safe markup:

| Write | Get |
|---|---|
| `**bold**`, `*italic*` | **bold**, *italic* |
| `$H2O$`, `$C_4H_{10}$`, `$H_3O^+^$` | Formulas: digits after letters become subscripts automatically; `_x` / `_{…}` subscript, `^…^` superscript |
| `10^−5^`, `x~2~` | Superscript / subscript outside a formula |
| `[text](#/learn/l03)` or `[text](https://…)` | Links (only in-app and https are allowed) |

HTML is always escaped, so it shows up as text rather than markup. Unicode works too (`→ ⇌ ° δ⁺ ₂`).

### SMILES quick reference

Structures are written as **SMILES** strings and drawn automatically.

| SMILES | Molecule |
|---|---|
| `CCCC` | butane (each `C` is a carbon; H's are implied) |
| `CC(C)CC` | 2-methylbutane: parentheses = branch |
| `CC=CC`, `CC#C` | 2-butene (double bond), propyne (triple) |
| `C/C=C\C`, `C/C=C/C` | *cis*- and *trans*-2-butene |
| `C1CCCCC1` | cyclohexane: matching digits close a ring |
| `c1ccccc1` | benzene (lowercase = aromatic) |
| `CCO`, `CCOCC`, `CCS` | ethanol, diethyl ether, ethanethiol |
| `CC=O`, `CC(C)=O`, `CC(=O)O` | acetaldehyde, acetone, acetic acid |
| `CC(=O)OC`, `CC(N)=O` | methyl acetate, acetamide |
| `CC(=O)[O-].[Na+]`, `[NH4+]` | sodium acetate; charges go in brackets |

Not sure? Type the name into the app's **Name Lab** and it shows the structure; or check a SMILES in `tests/gallery.html`.

Atom indices for `highlight`, `selectable` and `atoms` answers count heavy atoms (not H) in the order they appear in the SMILES, starting at 0. For `CC(O)C`, C0 C1 O2 C3.

## Questions

Every question has `id` (unique across the course, e.g. `l11-q01`), `skill`, `type`, `prompt`, and `explain`. The explanation is shown after answering, so make it teach. Optional on any question: `figure` (see below) and `hint` (practice mode only).

| `type` | Fields | Answer format |
|---|---|---|
| `mc` | `choices: [text…]`, `answer` | index of the right choice; choices are shuffled unless `shuffle: false` |
| `struct` | `choices: [{ smiles }…]`, `answer` | "Which structure is…" with drawn choices |
| `tf` | `answer` | `true` / `false` |
| `multi` | `choices`, `answer: [i, j…]` | "Select all that apply" |
| `num` | `answer`, `tol?` or `rel?`, `decimals?`, `placeholder?` | number; default tolerance 0.5% |
| `text` | `answer`, `accept?: [...]` | case/spacing-insensitive |
| `formula` | `answer: 'C4H10O'` | any element order accepted |
| `name` | `name: { smiles }`, `figure` | Type an IUPAC name; graded by the chemistry engine with specific feedback (wrong chain, numbering, alphabetical order…). Common names are accepted unless `name.iupacOnly: true` |
| `order` | `items`, `answer: [indices in correct order]` | |
| `match` | `left`, `right`, `answer: [right index for each left]` | |
| `atoms` | `figure: { smiles }`, `selectable?: [atom…]`, `answer: [atom…]` | "Tap every chirality center…" |

Figures: `{ smiles, numbers?, highlight? }`, `{ mols: [...] }`, `{ rxn: { from, reagent, to? } }`, or `{ tetras: [...] }`.

```js
{ id: 'l05-q07', skill: 'l05.naming', type: 'name', prompt: 'Name this alcohol.',
  figure: { smiles: 'OC1CCCCC1' }, name: { smiles: 'OC1CCCCC1' },
  explain: 'OH on a 6-membered ring, no other groups → **cyclohexanol** (no number needed).' },

{ id: 'l11-q01', skill: 'l11.naming', type: 'text', prompt: 'Name this ester (IUPAC).',
  figure: { smiles: 'CC(=O)OCC' }, answer: 'ethyl ethanoate', accept: ['ethyl acetate'],
  explain: 'Alcohol part (ethyl) first, then the acid part with **-ate**: **ethyl ethanoate** (ethyl acetate).' },
```

> `name` questions only work for families the chemistry engine can name: everything through Lecture 10 (alkanes through carboxylic acids and their salts). **Esters, amides and amines aren't supported yet.** Try a name in Name Lab: if it draws, it's supported. Until then, use `text` (as above), `mc` or `struct` questions for new families. Alternatively, extend `js/chem/namer.js` and `js/chem/nameparse.js` and add cases to `NAME_CASES` in `tests/chem.test.js`.

### Flashcards and glossary

```js
cards: [{ id: 'l11-k01', front: 'Ester functional group', back: '$RCOOR\'$' }],
keyTerms: [{ term: 'ester', def: 'A carbonyl compound with an OR group on the carbonyl carbon.' }],
```

Card ids must stay unique and **should never be renamed**: her review schedule is stored by id. The same goes for question ids, which her stats and mistakes are keyed on. Fixing the text of a card or question is fine; changing its id resets its history.

## Generators (unlimited practice)

Generators live in `js/quiz/gen/*.js` and are registered in `js/quiz/generators.js`. A generator looks like this:

```js
{ id: 'l11-ester-name', skill: 'l11.naming', title: 'Name the ester',
  make(r) {            // r = seeded random: r.int(a,b), r.pick(arr), r.chance(p), r.shuffle(arr)
    …
    return { type: 'mc', prompt, choices, answer, explain, figure };  // or null to skip this seed
  } }
```

- The same seed must always produce the same question. Use only `r`, never `Math.random()` or the current date.
- The tests run every generator with 150 seeds and check each question is valid and answerable. Add any new generator to the registry and the tests pick it up automatically.
- `js/chem/generator.js` can make random molecules of a family (`randomMolecule(r, 'alcohol')`). `js/chem/reactions.js` computes products. Reuse them where possible.

## Other content files

- [content/reactions.js](../content/reactions.js): the Reaction map.
  - Each reaction has a `type` (addition, elimination, oxidation, reduction, acid–base), a `rule`, numbered `steps` for drawing the product, a `trap`, and optionally `body` (where it happens in the body or in health care).
  - `section` links the **Notes** button to the lesson section, and `skill` sets what **Practice** drills.
  - A new reaction also needs an arrow on the map: add it to `EDGES` in [js/views/reactions.js](../js/views/reactions.js), and a row in `REAGENTS` if it uses a new reagent.
  - The tests check each example against the reaction engine, and that every reaction is on the map.
- [content/nursing.js](../content/nursing.js): **Nursing connection** notes. Each one is shown at the end of the lesson section it names, and all together under **Reference → Nursing**. Keep them short (the tests allow 420 characters) and accurate. They're marked as extra, beyond the slides.
- [content/bootcamp.js](../content/bootcamp.js): the Foundations Bootcamp steps.
- [content/messages.js](../content/messages.js): encouragement and milestone notes.
- [content/game.js](../content/game.js): Sea Lion Splash outfits, oceans, prices and messages. The wardrobe is shared by both games.
- [content/words.js](../content/words.js): Word Splash words.
  - Each has 4–9 letters, a lecture and section (for the **Notes** button), a clue (which must not contain the word), and optionally a structure.
  - When you add a lecture, add its key terms here too. Adding words changes which word comes up on future days, never a day already played.

## Adding new lectures to the game

Game decks are lists of generator ids in [js/game/decks.js](../js/game/decks.js). The game only uses generators whose questions are `mc`, `struct` or `tf`, trimmed to 2–3 short answers (44 characters max). To put a new lecture in the game:

1. Write a generator for it (see "Generators" above) that returns `mc` / `struct` / `tf` questions.
2. Add its id to an existing deck, or add a new deck: `{ id, name, desc, lectures: [11], gens: [...] }`.
3. Add it to the **Open Ocean** deck too.
4. Run the tests. They play every deck 60 times and check each question can be answered and rebuilt in the Mistakes notebook.

Keep deck ids unchanged once released, because best scores are saved by deck id.

## Checklist before pushing

- [ ] Tests pass.
- [ ] Skimmed the new pages in the app (`ruby tools/serve.rb`), including on a narrow window.
- [ ] Previewed new questions in `tests/questions.html?authored=l11` and, for generators, `?gen=<id>`.
- [ ] `contentVersion` bumped and `CHANGELOG` updated.
- [ ] `ruby tools/build-sw.rb` run (or let CI do it).
