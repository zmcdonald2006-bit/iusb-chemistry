// Tiny, safe markup language used by all lesson text, questions and flashcards.
//
//   **bold**   *italic*   ^superscript^   ~subscript~
//   $CH3CH2OH$        chemical formula: digits after letters/brackets become subscripts,
//                     _x or _{xy} force a subscript, ^x^ is a superscript, -> is an arrow
//   [link text](#/learn/l03)   links (only in-app "#/..." links or https URLs)
//   blank line = new paragraph · "- " at line start = bullet list
//
// All input is HTML-escaped first, so content can never inject markup.

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formula(src) {
  // src is already escaped
  let s = src
    .replace(/-&gt;/g, '→')
    .replace(/&lt;=&gt;/g, '⇌')
    .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>')
    .replace(/_([A-Za-z0-9+\-−])/g, '<sub>$1</sub>')
    .replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
  // digits following an element symbol, ) or ] become subscripts (not inside tags)
  s = s.replace(/(<[^>]+>)|([A-Za-z)\]])(\d+)/g, (m, tag, pre, digits) => (tag ? tag : `${pre}<sub>${digits}</sub>`));
  return `<span class="f">${s}</span>`;
}

export function inline(text) {
  let s = escapeHtml(text);
  // protect formulas first
  const slots = [];
  s = s.replace(/\$([^$]+)\$/g, (m, body) => { slots.push(formula(body)); return `\u0000${slots.length - 1}\u0000`; });
  s = s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\^([^^\s][^^]*?)\^/g, '<sup>$1</sup>')
    .replace(/~([^~\s][^~]*?)~/g, '<sub>$1</sub>')
    .replace(/-&gt;/g, '→')
    .replace(/\[([^\]]+)\]\((#\/[^)\s]*|https:\/\/[^)\s]+)\)/g, (m, label, href) => {
      const ext = href.startsWith('https://');
      return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
  s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => slots[+i]);
  return s;
}

// Block-level: paragraphs, bullet lists, line breaks.
export function markup(text) {
  if (text == null) return '';
  const paras = String(text).split(/\n{2,}/);
  return paras.map((p) => {
    const lines = p.split('\n');
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

// Plain text version (for aria labels, titles, search)
export function plain(text) {
  return String(text ?? '')
    .replace(/\*\*|\*|\^|~|\$/g, '')
    .replace(/_\{([^}]*)\}/g, '$1')
    .replace(/_(.)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}
