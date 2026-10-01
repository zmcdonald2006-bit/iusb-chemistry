// Tiny test harness that works in browsers, Node, and JavaScriptCore (jsc).
const suites = [];
let current = null;

export function describe(name, fn) {
  const suite = { name, tests: [] };
  const prev = current;
  current = suite;
  try { fn(); } finally { current = prev; }
  suites.push(suite);
}

export function it(name, fn) {
  if (!current) throw new Error('it() outside describe()');
  current.tests.push({ name, fn });
}

function fmt(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export class AssertionError extends Error {}

export function expect(actual) {
  const api = {
    toBe(exp) { if (actual !== exp) throw new AssertionError(`Expected ${fmt(exp)} but got ${fmt(actual)}`); },
    toEqual(exp) { if (fmt(actual) !== fmt(exp)) throw new AssertionError(`Expected ${fmt(exp)} but got ${fmt(actual)}`); },
    toBeTruthy() { if (!actual) throw new AssertionError(`Expected truthy but got ${fmt(actual)}`); },
    toBeFalsy() { if (actual) throw new AssertionError(`Expected falsy but got ${fmt(actual)}`); },
    toBeNull() { if (actual !== null) throw new AssertionError(`Expected null but got ${fmt(actual)}`); },
    toContain(x) {
      const ok = typeof actual === 'string' ? actual.includes(x) : Array.isArray(actual) && actual.some((a) => fmt(a) === fmt(x));
      if (!ok) throw new AssertionError(`Expected ${fmt(actual)} to contain ${fmt(x)}`);
    },
    toBeCloseTo(exp, tol = 1e-6) { if (Math.abs(actual - exp) > tol) throw new AssertionError(`Expected ${exp} ± ${tol} but got ${actual}`); },
    toBeGreaterThan(x) { if (!(actual > x)) throw new AssertionError(`Expected ${fmt(actual)} > ${x}`); },
    toBeLessThan(x) { if (!(actual < x)) throw new AssertionError(`Expected ${fmt(actual)} < ${x}`); },
    toThrow() {
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) throw new AssertionError('Expected function to throw');
    },
  };
  return api;
}

export async function run(log = (s) => (typeof print === 'function' ? print(s) : console.log(s))) {
  let pass = 0, fail = 0;
  const failures = [];
  for (const s of suites) {
    for (const t of s.tests) {
      try {
        const r = t.fn();
        if (r && typeof r.then === 'function') await r;
        pass++;
      } catch (e) {
        fail++;
        failures.push(`✗ ${s.name} › ${t.name}\n    ${e && e.message}`);
      }
    }
  }
  for (const f of failures) log(f);
  log(`\n${pass} passed, ${fail} failed (${suites.length} suites)`);
  return { pass, fail, failures };
}
