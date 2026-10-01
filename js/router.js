// Hash router: "#/learn/l03/naming?x=1" -> { path: '/learn/l03/naming', params, query }.
// Hash routing works on GitHub Pages without any server configuration.

export function parseHash(hash = location.hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const query = {};
  const dec = (s) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch { return s; } };
  for (const pair of qs.split('&')) {
    if (!pair) continue;
    const i = pair.indexOf('=');
    query[dec(i < 0 ? pair : pair.slice(0, i))] = i < 0 ? '' : dec(pair.slice(i + 1));
  }
  return { path: path.startsWith('/') ? path : `/${path}`, query };
}

export function matchRoute(routes, path) {
  const parts = path.split('/').filter(Boolean);
  for (const r of routes) {
    const rp = r.path.split('/').filter(Boolean);
    if (rp.length !== parts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(':')) params[rp[i].slice(1)] = decodeURIComponent(parts[i]);
      else if (rp[i] !== parts[i]) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

export function createRouter(routes, onRoute) {
  const handle = () => {
    const { path, query } = parseHash();
    const m = matchRoute(routes, path) || { route: routes.find((r) => r.path === '*'), params: {} };
    onRoute({ ...m, path, query });
  };
  window.addEventListener('hashchange', handle);
  return {
    start: handle,
    navigate(href, { replace = false } = {}) {
      if (replace) {
        history.replaceState(null, '', href);
        handle();
      } else if (location.hash === href) handle();
      else location.hash = href.replace(/^#/, '');
    },
  };
}
