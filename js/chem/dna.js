// DNA and RNA strands drawn the way the Lecture 20 slides draw them: one letter per base, the
// sugar–phosphate backbone on the outside, the 5′ and 3′ ends labeled, and the complementary strand
// running the other way with 2 hydrogen bonds for each A–T (or A–U) pair and 3 for each G–C pair.
// The pairing rules live here too, so questions and their answers come from the same code.

export const DNA_BASES = ['A', 'C', 'G', 'T'];
export const RNA_BASES = ['A', 'C', 'G', 'U'];
export const BASE_NAMES = { A: 'adenine', G: 'guanine', C: 'cytosine', T: 'thymine', U: 'uracil' };
export const PURINES = ['A', 'G'];

// The base that pairs with each base. In RNA, A pairs with U instead of T.
export function pairOf(b, { rna = false } = {}) {
  switch (b) {
    case 'A': return rna ? 'U' : 'T';
    case 'T': case 'U': return 'A';
    case 'G': return 'C';
    case 'C': return 'G';
    default: throw new Error(`not a base: "${b}"`);
  }
}

// The complementary strand, base by base under the original. If the original is written 5′→3′,
// this is the partner strand written 3′→5′ (the way the slides line them up).
export const complement = (seq, opts) => [...seq].map((b) => pairOf(b, opts)).join('');
// The partner strand written 5′→3′: the same letters read from the other end.
export const reverse = (seq) => [...seq].reverse().join('');
export const complement53 = (seq, opts) => reverse(complement(seq, opts));
// Hydrogen bonds holding a base pair together: A–T and A–U have 2, G–C has 3.
export const hBondsOf = (b) => (b === 'G' || b === 'C' ? 3 : 2);
export const hBonds = (seq) => [...seq].reduce((n, b) => n + hBondsOf(b), 0);

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * spec = {
 *   top: 'GATTCGA',            // the strand written 5′ → 3′, left to right
 *   bottom: 'auto' (default) | 'none' | 'blank' | 'ATC…',  // the partner strand, 3′ → 5′
 *   bonds: true,               // dashed hydrogen bonds between pairs (default: when there is a partner)
 *   rna: false,                // pair A with U in an automatic partner strand
 *   title,
 * }
 */
export function renderDNA(spec, opts = {}) {
  const top = String(spec.top || '').toUpperCase();
  if (!top || /[^ACGTU]/.test(top)) throw new Error(`bad strand "${spec.top}"`);
  const mode = spec.bottom || 'auto';
  const bottom = mode === 'auto' ? complement(top, { rna: spec.rna }) : mode === 'blank' ? '?'.repeat(top.length) : mode === 'none' ? '' : String(mode).toUpperCase();
  if (bottom && bottom.length !== top.length) throw new Error('the two strands must be the same length');
  if (bottom && /[^ACGTU?]/.test(bottom)) throw new Error(`bad strand "${bottom}"`);
  const showBonds = bottom && mode !== 'blank' && spec.bonds !== false;
  const PAIRS = ['AT', 'TA', 'AU', 'UA', 'GC', 'CG'];
  if (showBonds) for (let i = 0; i < top.length; i++) if (!PAIRS.includes(top[i] + bottom[i])) throw new Error(`${top[i]} does not pair with ${bottom[i]}`);

  const CELL = 30, BOX = 24, M = 34, FS = 15;
  const width = M * 2 + top.length * CELL;
  const yTop = 22, yBot = 80;
  const height = bottom ? yBot + BOX + 22 : yTop + BOX + 22;
  const parts = [];
  const cx = (i) => M + i * CELL + CELL / 2;
  const box = (b, i, y) => {
    const x = cx(i) - BOX / 2;
    parts.push(`<rect class="base base-${b === '?' ? 'q' : b}" x="${r2(x)}" y="${y}" width="${BOX}" height="${BOX}" rx="4"/>`);
    parts.push(`<text class="base-letter" x="${r2(cx(i))}" y="${r2(y + BOX / 2 + FS * 0.36)}" font-size="${FS}" text-anchor="middle">${b}</text>`);
  };
  const backbone = (y, stemTo) => {
    parts.push(`<line class="dna-bb" x1="${r2(cx(0) - 6)}" y1="${y}" x2="${r2(cx(top.length - 1) + 6)}" y2="${y}"/>`);
    for (let i = 0; i < top.length; i++) parts.push(`<line class="dna-stem" x1="${r2(cx(i))}" y1="${y}" x2="${r2(cx(i))}" y2="${stemTo}"/>`);
  };
  const end = (t, x, y, anchor) => parts.push(`<text class="dna-end" x="${r2(x)}" y="${r2(y + 5)}" font-size="13" text-anchor="${anchor}">${t}</text>`);

  backbone(10, yTop);
  [...top].forEach((b, i) => box(b, i, yTop));
  end('5′', M - 6, yTop + BOX / 2, 'end');
  end('3′', width - M + 6, yTop + BOX / 2, 'start');
  if (bottom) {
    backbone(yBot + BOX + 12, yBot + BOX);
    [...bottom].forEach((b, i) => box(b, i, yBot));
    end('3′', M - 6, yBot + BOX / 2, 'end');
    end('5′', width - M + 6, yBot + BOX / 2, 'start');
    if (showBonds) {
      for (let i = 0; i < top.length; i++) {
        const k = hBondsOf(top[i]);
        for (let j = 0; j < k; j++) {
          const x = cx(i) + (j - (k - 1) / 2) * 6;
          parts.push(`<line class="hbond" x1="${r2(x)}" y1="${yTop + BOX + 4}" x2="${r2(x)}" y2="${yBot - 4}"/>`);
        }
      }
    }
  }
  const title = opts.title || spec.title;
  const label = title ? `<title>${String(title).replace(/[*_<>&]/g, '')}</title>` : '';
  return `<svg class="mol-svg dna-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(width)} ${height}" width="${r2(width)}" height="${height}" role="img">${label}${parts.join('')}</svg>`;
}
