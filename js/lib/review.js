// What goes on a lecture's review sheet, pulled from its notes in the order they appear:
// the boxed rules, exam tips, memory tricks and traps ("life" connections are left out), plus the
// step-by-step methods, tables and side-by-side comparisons for the "more" part of the sheet.
export const SHEET_GROUPS = [
  { id: 'rules', kinds: ['key', 'exam', 'tip'], title: 'The big ideas', icon: 'key' },
  { id: 'memory', kinds: ['memory'], title: 'Memory tricks', icon: 'heart' },
  { id: 'traps', kinds: ['warn'], title: 'Watch out', icon: 'warn' },
];
const EXTRA = new Set(['steps', 'table', 'compare']);

export function sheetParts(lecture) {
  const groups = SHEET_GROUPS.map((g) => ({ ...g, items: [] }));
  const extras = [];
  for (const section of lecture.sections) {
    for (const block of section.blocks) {
      if (block.t === 'callout') {
        const g = groups.find((x) => x.kinds.includes(block.kind));
        if (g) g.items.push({ block, section });
      } else if (EXTRA.has(block.t)) extras.push({ block, section });
    }
  }
  return { groups: groups.filter((g) => g.items.length), extras, terms: lecture.keyTerms || [] };
}
