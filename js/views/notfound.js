import { h } from '../ui/dom.js';
import { emptyState } from '../ui/components.js';

export default function notFound({ main }) {
  main.appendChild(emptyState('info', 'Page not found', 'That link doesn\'t go anywhere (maybe it changed in an update).', h('a', { class: 'btn', href: '#/' }, 'Go home')));
}
