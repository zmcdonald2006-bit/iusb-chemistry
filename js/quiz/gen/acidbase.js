// Lecture 9: acids, bases, pH and buffers.
import { mcq } from './common.js';

// Conjugate acid/base pairs (display strings use Unicode sub/superscripts)
export const PAIRS = [
  ['HCl', 'Cl⁻'], ['HBr', 'Br⁻'], ['HNO₃', 'NO₃⁻'], ['H₂SO₄', 'HSO₄⁻'], ['HSO₄⁻', 'SO₄²⁻'],
  ['H₃O⁺', 'H₂O'], ['H₂O', 'OH⁻'], ['NH₄⁺', 'NH₃'], ['H₂CO₃', 'HCO₃⁻'], ['HCO₃⁻', 'CO₃²⁻'],
  ['CH₃COOH', 'CH₃COO⁻'], ['H₃PO₄', 'H₂PO₄⁻'], ['H₂PO₄⁻', 'HPO₄²⁻'], ['HPO₄²⁻', 'PO₄³⁻'], ['HF', 'F⁻'], ['HCN', 'CN⁻'],
];

// Ka values (Smith Table 9.3)
export const KA = [
  ['hydrogen sulfate ion', 'HSO₄⁻', 1.2e-2], ['phosphoric acid', 'H₃PO₄', 7.5e-3], ['hydrofluoric acid', 'HF', 7.2e-4],
  ['acetic acid', 'CH₃COOH', 1.8e-5], ['carbonic acid', 'H₂CO₃', 4.3e-7], ['dihydrogen phosphate ion', 'H₂PO₄⁻', 6.2e-8],
  ['ammonium ion', 'NH₄⁺', 5.6e-10], ['hydrocyanic acid', 'HCN', 4.9e-10], ['bicarbonate ion', 'HCO₃⁻', 5.6e-11],
];

function sci(x, digits = 2) {
  const e = Math.floor(Math.log10(x));
  let m = x / Math.pow(10, e);
  let mm = m.toFixed(digits - 1);
  let ee = e;
  if (parseFloat(mm) >= 10) { mm = (m / 10).toFixed(digits - 1); ee++; }
  return { m: mm, e: ee, text: `${mm} × 10^${ee}^` };
}

// Reactions for "identify the acid/base"
const BASES = [['H₂O', 'H₃O⁺'], ['NH₃', 'NH₄⁺'], ['OH⁻', 'H₂O'], ['CO₃²⁻', 'HCO₃⁻']];
const ACIDS = [['HCl', 'Cl⁻'], ['HBr', 'Br⁻'], ['HF', 'F⁻'], ['CH₃COOH', 'CH₃COO⁻'], ['HNO₃', 'NO₃⁻'], ['HCN', 'CN⁻'], ['H₂O', 'OH⁻'], ['NH₄⁺', 'NH₃']];

export const acidBaseGenerators = [
  {
    id: 'l09-ph', skill: 'l09.ph', title: 'pH from [H₃O⁺]',
    make(r) {
      const m = (r.int(10, 99) / 10);
      const e = r.int(1, 13);
      const conc = m * Math.pow(10, -e);
      const ph = -Math.log10(conc);
      const rounded = Math.round(ph * 100) / 100;
      const kind = rounded < 7 ? 'acidic' : rounded > 7 ? 'basic' : 'neutral';
      return {
        type: 'num', skill: 'l09.ph', answer: rounded, tol: 0.011, decimals: 2,
        prompt: `A solution has $[H_3O^+^]$ = **${m.toFixed(1)} × 10^−${e}^ M**. What is its pH?`,
        placeholder: 'e.g. 4.92',
        explain: `pH = −log[$H_3O^+^$] = −log(${m.toFixed(1)} × 10^−${e}^) = **${rounded.toFixed(2)}**. Sig-fig rule: ${m.toFixed(1)} has **2** significant digits, so the pH gets **2 decimal places**. The solution is **${kind}** (pH ${kind === 'acidic' ? '< 7' : kind === 'basic' ? '> 7' : '= 7'}).`,
        hint: 'Calculator: type the concentration, press log, then change the sign.',
      };
    },
  },
  {
    id: 'l09-h3o', skill: 'l09.ph', title: '[H₃O⁺] from pH',
    make(r) {
      const ph = r.int(100, 1300) / 100;
      const conc = Math.pow(10, -ph);
      const s = sci(conc, 2);
      const val = parseFloat(s.m) * Math.pow(10, s.e);
      return {
        type: 'num', skill: 'l09.ph', answer: val, rel: 0.04,
        answerText: `${s.m} × 10^${s.e} M`,
        prompt: `A solution has pH = **${ph.toFixed(2)}**. What is $[H_3O^+^]$ (in M)?`,
        placeholder: 'e.g. 3.2 x 10^-5',
        explain: `$[H_3O^+^]$ = 10^−pH^ = 10^−${ph.toFixed(2)}^ = **${s.m} × 10^${s.e}^ M**. (pH has 2 decimal places → 2 significant digits.) ${ph < 7 ? 'Acidic: greater than 1 × 10^−7^ M.' : ph > 7 ? 'Basic: less than 1 × 10^−7^ M.' : 'Neutral.'}`,
        hint: 'Calculator: 10^x (or "antilog") of −pH.',
      };
    },
  },
  {
    id: 'l09-acidic', skill: 'l09.ph', title: 'Acidic, basic or neutral?',
    make(r) {
      const useConc = r.chance(0.5);
      const e = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const ph = r.pick([1.5, 2.8, 4.2, 5.6, 6.9, 7.0, 7.4, 8.3, 9.9, 12.1]);
      let prompt, ans;
      if (useConc) {
        const m = e === 7 ? 1 : r.int(12, 95) / 10;
        prompt = `$[H_3O^+^]$ = ${m === 1 ? '1.0' : m.toFixed(1)} × 10^−${e}^ M. The solution is…`;
        const val = m * Math.pow(10, -e);
        ans = Math.abs(val - 1e-7) < 1e-12 ? 2 : val > 1e-7 ? 0 : 1;
      } else {
        prompt = `A solution has pH ${ph}. The solution is…`;
        ans = ph < 7 ? 0 : ph > 7 ? 1 : 2;
      }
      return mcq(prompt, ['acidic', 'basic', 'neutral'], ans, {
        skill: 'l09.ph', shuffle: false,
        explain: 'Acidic: pH < 7 and $[H_3O^+^]$ > 1 × 10^−7^ M. Basic: pH > 7 and $[H_3O^+^]$ < 1 × 10^−7^ M. Neutral: exactly 7 / 1 × 10^−7^ M. (Lower pH = more $H_3O^+^$.)',
      });
    },
  },
  {
    id: 'l09-conjugate', skill: 'l09.conjugates', title: 'Conjugate acids & bases',
    make(r) {
      const [acid, base] = r.pick(PAIRS);
      const askBase = r.chance(0.5);
      const given = askBase ? acid : base;
      const ans = askBase ? base : acid;
      const pool = [...new Set(PAIRS.flat())].filter((x) => x !== ans && x !== given);
      const wrong = r.shuffle(pool).slice(0, 3);
      return mcq(`What is the **conjugate ${askBase ? 'base' : 'acid'}** of **${given}**?`, [ans, ...wrong], 0, {
        skill: 'l09.conjugates',
        explain: askBase
          ? `Conjugate base = the acid **minus one H⁺** (so the charge goes down by 1): ${given} → **${ans}**.`
          : `Conjugate acid = the base **plus one H⁺** (so the charge goes up by 1): ${given} → **${ans}**.`,
      });
    },
  },
  {
    id: 'l09-identify', skill: 'l09.bronsted', title: 'Identify acid & base',
    make(r) {
      let a, b;
      do { a = r.pick(ACIDS); b = r.pick(BASES); } while (new Set([a[0], a[1], b[0], b[1]]).size < 4);
      const eq = `${a[0]} + ${b[0]} → ${a[1]} + ${b[1]}`;
      const roles = [['the acid', a[0]], ['the base', b[0]], ['the conjugate base', a[1]], ['the conjugate acid', b[1]]];
      const [role, species] = r.pick(roles);
      const choices = [a[0], b[0], a[1], b[1]];
      return mcq(`In the reaction **${eq}**, which species is **${role}**?`, choices, choices.indexOf(species), {
        skill: 'l09.bronsted', shuffle: false,
        explain: `${a[0]} **loses** an H⁺ → it's the acid, and ${a[1]} is its conjugate base. ${b[0]} **gains** that H⁺ → it's the base, and ${b[1]} is its conjugate acid. So ${role} is **${species}**.`,
      });
    },
  },
  {
    id: 'l09-ka-order', skill: 'l09.ka', title: 'Rank by Ka',
    make(r) {
      const picks = r.shuffle(KA).slice(0, r.int(3, 4));
      const order = [...picks.keys()].sort((a, b) => picks[a][2] - picks[b][2]);
      return {
        type: 'order', skill: 'l09.ka',
        prompt: 'Order these acids from **weakest to strongest**.',
        items: picks.map(([n, f, ka]) => `${f} (Ka = ${sci(ka).m} × 10^${sci(ka).e}^)`),
        answer: order,
        explain: 'The **larger the Ka, the stronger the acid** (it ionizes more). Compare exponents first: 10^−2^ is much larger than 10^−10^.',
      };
    },
  },
  {
    id: 'l09-ka-expr', skill: 'l09.ka', title: 'Write Ka',
    make(r) {
      const acids = [['CH₃COOH', 'CH₃COO⁻'], ['HF', 'F⁻'], ['HCN', 'CN⁻'], ['H₂CO₃', 'HCO₃⁻'], ['NH₄⁺', 'NH₃']];
      const [ha, a] = r.pick(acids);
      const right = `[H₃O⁺][${a}] / [${ha}]`;
      const wrong = [`[${ha}] / [H₃O⁺][${a}]`, `[H₃O⁺][${a}] / [${ha}][H₂O]`, `[H₃O⁺] / [${ha}]`];
      return mcq(`Which is the correct **Ka** expression for ${ha} + H₂O ⇌ H₃O⁺ + ${a}?`, [right, ...wrong], 0, {
        skill: 'l09.ka',
        explain: 'Ka = **products over reactants** at equilibrium, and **water is left out**: Ka = [H₃O⁺][A⁻] / [HA].',
      });
    },
  },
  {
    id: 'l09-stronger', skill: 'l09.ka', title: 'Stronger acid?',
    make(r) {
      const [x, y] = r.shuffle(KA).slice(0, 2);
      const ans = x[2] > y[2] ? 0 : 1;
      return mcq(`Which is the **stronger acid**: ${x[1]} (Ka ${sci(x[2]).text}) or ${y[1]} (Ka ${sci(y[2]).text})?`, [x[1], y[1]], ans, {
        skill: 'l09.ka', shuffle: false,
        explain: `Larger Ka = stronger acid → **${ans === 0 ? x[1] : y[1]}**. Its conjugate base is the *weaker* base. At equilibrium, the reaction favors formation of the **weaker** acid.`,
      });
    },
  },
  {
    id: 'l09-buffer', skill: 'l09.buffers', title: 'Buffers',
    make(r) {
      const good = [['CH₃COOH and CH₃COONa', 'acetic acid + its conjugate base (acetate)'], ['H₂CO₃ and NaHCO₃', 'carbonic acid + bicarbonate'], ['NaH₂PO₄ and Na₂HPO₄', 'dihydrogen phosphate + hydrogen phosphate'], ['HF and NaF', 'hydrofluoric acid + fluoride'], ['NH₄Cl and NH₃', 'ammonium (weak acid) + ammonia']];
      const bad = ['HCl and NaCl', 'NaOH and NaCl', 'HCl and NaOH', 'CH₃COOH and HCl', 'NaCl and KCl', 'HNO₃ and NaNO₃'];
      const [g, why] = r.pick(good);
      const wrong = r.shuffle(bad).slice(0, 3);
      return mcq('Which pair of compounds makes a **buffer**?', [g, ...wrong], 0, {
        skill: 'l09.buffers',
        explain: `A buffer needs a **weak acid + the salt of its conjugate base** in roughly equal amounts: ${why}. Strong acids like HCl (and their salts) can't buffer.`,
      });
    },
  },
  {
    id: 'l09-blood', skill: 'l09.blood', title: 'Blood pH',
    make(r) {
      const qs = [
        ['A patient with lung disease cannot exhale enough CO₂. What happens to their blood?', ['pH drops — respiratory acidosis', 'pH rises — respiratory alkalosis', 'pH stays exactly 7.40', 'Blood becomes neutral (pH 7)'], 0,
          'Extra CO₂ makes more H₂CO₃ → more H₃O⁺ → **pH falls**: respiratory **acidosis**.'],
        ['Someone is hyperventilating during a panic attack. What happens to their blood?', ['pH rises — respiratory alkalosis', 'pH drops — respiratory acidosis', 'Nothing changes', 'CO₂ builds up'], 0,
          'Breathing fast blows off too much CO₂ → less H₂CO₃ → less H₃O⁺ → **pH rises**: respiratory **alkalosis**.'],
        ['What is the normal pH range of blood?', ['7.35 – 7.45', '6.8 – 7.0', '7.0 exactly', '7.8 – 8.2'], 0, 'Normal blood pH is **7.35–7.45** (slightly basic).'],
        ['What is the main buffer in blood?', ['Carbonic acid / bicarbonate (H₂CO₃ / HCO₃⁻)', 'Acetic acid / acetate', 'HCl / Cl⁻', 'Ammonia / ammonium'], 0, 'The **H₂CO₃ / HCO₃⁻** system, linked to CO₂: CO₂ + H₂O ⇌ H₂CO₃ ⇌ H₃O⁺ + HCO₃⁻.'],
      ];
      const [p, choices, a, why] = r.pick(qs);
      return mcq(p, choices, a, { skill: 'l09.blood', explain: why });
    },
  },
];
