// How progress is stored in the cloud: this device's own bits are left out, and big copies are
// gzipped (Firestore documents are limited to 1 MB; typical progress is far smaller).
import { stableStringify } from '../state/store.js';

// Settings that belong to one device, not the account.
export const DEVICE_META = ['lastSeenVersion', 'persistAsked', 'installDismissed', 'lastBackupAt', 'cloudUid', 'nudgeDismissed', 'deviceId'];
export const MAX_BYTES = 900000;
const GZIP_OVER = 400000;

export function cloudCopy(state) {
  const c = JSON.parse(JSON.stringify(state));
  delete c.active;
  delete c.lastResult;
  delete c.updatedAt;
  if (c.meta) for (const k of DEVICE_META) delete c.meta[k];
  return c;
}

// Same string ⇔ same synced progress (ignores device-only bits and key order).
export const fingerprint = (state) => stableStringify(cloudCopy(state));

export async function encodeState(state) {
  const json = JSON.stringify(cloudCopy(state));
  const bytes = utf8Length(json);
  if (bytes > GZIP_OVER && typeof CompressionStream === 'function') {
    const gz = await pipe(new TextEncoder().encode(json), new CompressionStream('gzip'));
    const data = toBase64(gz);
    if (data.length <= MAX_BYTES) return { enc: 'gz64', data };
  }
  if (bytes > MAX_BYTES) throw Object.assign(new Error('Your progress is too big to save to the cloud.'), { code: 'cc/too-big' });
  return { enc: 'json', data: json };
}

export async function decodeState(doc) {
  if (!doc || typeof doc.data !== 'string') return null;
  if (doc.enc === 'gz64') {
    if (typeof DecompressionStream !== 'function') throw Object.assign(new Error('Please update your browser to load your saved progress.'), { code: 'cc/old-browser' });
    const bytes = await pipe(fromBase64(doc.data), new DecompressionStream('gzip'));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  return JSON.parse(doc.data);
}

function utf8Length(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c >= 0xd800 && c < 0xdc00 ? (i++, 4) : 3;
  }
  return n;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
