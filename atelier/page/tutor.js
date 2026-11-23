// The tutorial: a "?" on each part of the page worth a word, which says what
// the part is for when pointed at or touched. One button turns them all on or
// off; they are on for a first visit.

import { t, language } from '../i18n.js';
import { $, el, remember, keep } from './dom.js';

/** What gets a mark: its words (i18n: tip.<name>) and the part of the page they are about. */
const TIPS = [
    ['home', '#home'], ['tabs', 'nav.tabs'], ['list', '#items'], ['stage', '#viewport'], ['write', '#note'], ['about', '#about'],
    ['style', '#style-open'], ['settings', '#more'], ['export', '#export'], ['listening', '#listening'], ['language', '.lang'],
];
let on = remember('tutor', '1') === '1';

/** Puts each mark on the corner of its part, wherever the page has moved it to; none on a part that is not on show. */
export function drawTutor() {
    const layer = $('tips');
    $('tutor').setAttribute('aria-pressed', String(on));
    if (!on) { if (layer.children.length) layer.replaceChildren(); return; }
    if (layer.dataset.for !== language()) {
        layer.dataset.for = language();
        layer.replaceChildren(...TIPS.map(([name]) => {
            const mark = el('button', { type: 'button', className: 'tip' }, '?', el('span', { className: 'bubble', textContent: t(`tip.${name}`) }));
            mark.setAttribute('aria-label', t(`tip.${name}`));
            // A touch screen has no pointer to hover with: a touch opens it, another closes it.
            mark.addEventListener('click', event => { event.stopPropagation(); for (const other of layer.children) if (other !== mark) other.classList.remove('open'); mark.classList.toggle('open'); });
            return mark;
        }));
    }
    const busy = !!document.querySelector('dialog[open]');
    TIPS.forEach(([, selector], i) => {
        const mark = layer.children[i], part = document.querySelector(selector), box = part?.getBoundingClientRect();
        const shown = !busy && !!box && box.width > 0 && box.height > 0 && getComputedStyle(part).visibility !== 'hidden';
        mark.hidden = !shown;
        if (!shown) return;
        const x = Math.min(innerWidth - 30, Math.max(4, box.right - 16)), y = Math.min(innerHeight - 30, Math.max(4, box.top - 10));
        mark.style.left = `${x}px`; mark.style.top = `${y}px`;
        // The words open towards the middle of the page, so that they are never cut by its edge.
        mark.classList.toggle('leftwards', x > innerWidth / 2);
        mark.classList.toggle('upwards', y > innerHeight * 0.6);
    });
}

$('tutor').addEventListener('click', () => { on = !on; keep('tutor', on ? '1' : '0'); drawTutor(); });
addEventListener('click', () => { for (const mark of $('tips').children) mark.classList.remove('open'); });
addEventListener('resize', drawTutor);
