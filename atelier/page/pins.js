import { t } from '../i18n.js';
import { $, el } from './dom.js';
import { note } from './activity.js';
import { frame, shown } from './stage.js';

// ── Pointing at a spot: a remark is clearer with a pin than with a description. ──
export const pins = [];
export function clearPins() { pins.length = 0; $('pins').replaceChildren(); }
/** What is under a point of the picture: the layer, and where in it. */
function under(x, y) {
    const doc = frame.contentDocument;
    let best = null;
    for (const layer of doc?.querySelectorAll('[data-fig-layer]') ?? []) {
        if (layer.dataset.figLayer === 'marks' || layer.dataset.figLayer === 'fx') continue;
        const box = layer.getBoundingClientRect();
        if (box.width < 1 || x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!best || box.width * box.height < best.area) best = { name: layer.dataset.figLayer, area: box.width * box.height, at: [Math.round(100 * (x - box.left) / box.width), Math.round(100 * (y - box.top) / box.height)] };
    }
    return best;
}
$('pin').addEventListener('click', () => {
    const on = $('pin').getAttribute('aria-pressed') !== 'true';
    $('pin').setAttribute('aria-pressed', String(on));
    $('pins').classList.toggle('on', on);
    $('saved').textContent = on ? t('pin.on') : '';
    if (on && shown()?.playing) $('pause').click(); // a still picture is easier to point at
});
$('pins').addEventListener('click', event => {
    const box = frame.getBoundingClientRect(), scale = box.width / frame.width;
    const x = (event.clientX - box.left) / scale, y = (event.clientY - box.top) / scale;
    if (x < 0 || y < 0 || x > frame.width || y > frame.height) return; // beside the picture
    const hit = under(x, y);
    const number = pins.length + 1;
    note('pin');
    pins.push(hit
        ? `Pin ${number}: on "${hit.name}", ${hit.at[0]}% from its left, ${hit.at[1]}% from its top${frame.contentWindow?.stage ? `, at ${(frame.contentWindow.stage.time / 1000).toFixed(2)} s` : ''}`
        : `Pin ${number}: on the empty stage, ${Math.round(100 * x / frame.width)}% from the left, ${Math.round(100 * y / frame.height)}% from the top`);
    const area = $('viewport').getBoundingClientRect();
    $('pins').append(el('span', { className: 'pin', textContent: String(number), style: `left:${event.clientX - area.left}px;top:${event.clientY - area.top}px` }));
    $('note').focus();
});
export const pinned = () => pins;
