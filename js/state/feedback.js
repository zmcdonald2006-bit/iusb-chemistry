// "This confused me" reports. Each one is kept on the device until it's delivered to the cloud
// database (feedback collection; see firestore.rules), so nothing is lost while offline or signed out.
//
// send(report) → Promise<boolean>: true when delivered, false when it can't be yet (not signed in).
// It may also throw (offline, etc.); the report then stays queued and is retried later.
const KEY = 'chem-companion:feedback';
const MAX_QUEUED = 50;

export const KINDS = [
  { id: 'unclear', label: 'The explanation didn\'t make sense' },
  { id: 'wrong', label: 'I think the answer is wrong' },
  { id: 'topic', label: 'I don\'t get this topic' },
  { id: 'other', label: 'Something else' },
];

// Longest allowed length of each text field (firestore.rules enforces the same limits).
export const LIMITS = { who: 60, note: 1000, where: 200, link: 500, item: 200, question: 2000, given: 500, answer: 500, app: 40 };

const cut = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

// Keep only the known fields, as strings of the allowed length (plus kind and ts).
export function cleanReport(r, now = Date.now()) {
  const out = { kind: KINDS.some((k) => k.id === r.kind) ? r.kind : 'other', ts: Math.round(Number(r.ts) || now) };
  for (const [k, n] of Object.entries(LIMITS)) {
    const v = cut(r[k], n);
    if (v) out[k] = v;
  }
  return out;
}

export function createFeedback({ storage, send, now = () => Date.now(), onChange = null }) {
  let queue = load();
  let sending = null;

  function load() {
    try { const v = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function save() {
    try { storage.setItem(KEY, JSON.stringify(queue)); } catch { /* storage full or blocked: keep it in memory */ }
    if (onChange) { try { onChange(queue.length); } catch { /* ignore */ } }
  }

  // Send everything queued, oldest first. Stops at the first report that can't be delivered yet.
  function flush() {
    if (sending) return sending;
    sending = (async () => {
      queue = load(); // another tab may have changed it
      while (queue.length) {
        let ok = false;
        try { ok = await send(queue[0]); } catch { ok = false; }
        if (!ok) break;
        const sentId = queue[0].id;
        queue = load().filter((r) => r.id !== sentId);
        save();
      }
    })().finally(() => { sending = null; });
    return sending;
  }

  return {
    // Queue a report and try to send it. Resolves to 'sent' or 'saved' (kept to send later).
    async add(report) {
      const r = { ...cleanReport(report, now()), id: `${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}` };
      queue = [...load(), r].slice(-MAX_QUEUED);
      save();
      await flush();
      return load().some((x) => x.id === r.id) ? 'saved' : 'sent';
    },
    flush,
    get pending() { return load().length; },
  };
}
