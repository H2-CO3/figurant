// Time. A scene's timeline (who does what, when), the bar under the picture,
// and going to a moment: a click or a drag holds the picture there, so that
// what is said next is about that moment.

import { t } from '../i18n.js';
import { $, el } from './dom.js';
import { config, view, current, exists } from './project.js';
import { note } from './activity.js';
import { frame, shown, load, say, tools } from './stage.js';
import { advanced } from './talk.js';

/** The timeline of a scene: who does what, when. Read-only: it is changed by saying so. */
export function timeline() {
    const composition = view.shop === 'compositions' ? config.compositions?.[current()] : null;
    $('timeline').hidden = !composition;
    if (!composition || $('timeline').dataset.for === current()) return;
    $('timeline').dataset.for = current();
    const starts = Object.values(composition.tracks ?? {}).flatMap(clips => clips.map(clip => clip.at));
    const length = composition.length ?? (starts.length ? Math.max(...starts) + 4000 : 4000);
    const label = clip => clip.play ?? (clip.move ? t(`move.${clip.move}`) === `move.${clip.move}` ? clip.move : t(`move.${clip.move}`) : clip.walk !== undefined ? t('clip.walk') : clip.exit ? t('clip.exit') : clip.fly !== undefined ? clip.fly ? t('clip.fly') : t('clip.land') : t('clip.set'));
    $('timeline').replaceChildren(
        ...composition.cast.map(member => {
            const clips = composition.tracks?.[member.id] ?? [];
            const lane = el('div', { className: 'lane' }, ...clips.map((clip, i) => {
                const end = clips[i + 1]?.at ?? Math.min(length, clip.at + (clip.play ? 4000 : 1400));
                return el('span', { className: `clip${clip.play ? ' play' : ''}`, textContent: label(clip), title: `${(clip.at / 1000).toFixed(1)} s`, style: `left:${100 * clip.at / length}%;width:${Math.max(1.2, 100 * (end - clip.at) / length - 0.4)}%` });
            }));
            return el('div', { className: 'track' }, el('span', { className: 'who', textContent: `${member.id}` , title: member.character }), lane);
        }),
        // Its sounds, on a track of their own: each from its start to the next one's.
        ...(composition.sounds?.length ? [el('div', { className: 'track' }, el('span', { className: 'who', textContent: '♪' }), el('div', { className: 'lane' }, ...[...composition.sounds].sort((a, b) => a.at - b.at).map((cue, i, all) => {
            const end = all[i + 1]?.at ?? length;
            return el('span', { className: 'clip', textContent: String(cue.src).split('/').pop(), title: `${(cue.at / 1000).toFixed(1)} s · ${cue.src}`, style: `left:${100 * cue.at / length}%;width:${Math.max(1.2, 100 * (end - cue.at) / length - 0.4)}%` });
        })))] : []),
        el('div', { className: 'track' }, el('span'), el('div', { className: 'ruler' }, ...[0, 0.25, 0.5, 0.75, 1].map(part => el('span', { textContent: `${(length * part / 1000).toFixed(1)} s` })))),
        el('div', { className: 'head' }, el('i', { id: 'playhead' })),
    );
    $('timeline').dataset.length = String(length);
}

let dragging = false;
/** How long what is on show lasts, kept while its page reloads. */
let lasts = { for: '', length: 0 };
/** Where what is on show is in its own time, and how long it lasts (0 while not known). */
function span() {
    const s = frame.contentWindow?.stage;
    if (!s?.ready) return null;
    if (view.shop === 'compositions') return { at: s.length ? s.time % s.length : s.time, length: s.length, base: 0 };
    const at = Math.max(0, s.time - s.began);
    return { at: s.length ? Math.min(at, s.length) : at, length: s.length, base: s.began, over: s.length > 0 && at > s.length };
}
async function seekTo(ms) {
    const s = frame.contentWindow?.stage, now = span();
    if (!s?.seek || !now) return;
    ms = Math.max(0, now.length ? Math.min(ms, now.length) : ms);
    view.moment = ms;
    $('pause').textContent = t('play');
    advanced(true); showMoment();
    // Ahead of the playhead: time runs on to it. Behind: it starts again and runs up to it.
    if (ms >= now.at && !now.over) await s.seek(now.base + ms);
    else { view.seek = now.base + ms || 1; load(); view.moment = ms; }
    note('seek', { value: Math.round(ms) });
}
const showMoment = () => { $('moment-bar').hidden = view.moment == null; $('moment').textContent = view.moment == null ? '' : t('moment', { s: (view.moment / 1000).toFixed(1) }); };
/** The moment under the pointer on a bar as long as the whole. */
const whole = () => { const now = span(), key = `${view.shop}/${current()}`; if (now?.length) lasts = { for: key, length: now.length }; return now?.length || (lasts.for === key ? lasts.length : 0) || now?.at || 0; };
const momentAt = (event, bar) => { const box = bar.getBoundingClientRect(); return whole() * Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)); };
for (const [id, bar] of [['scrub', () => $('scrub')], ['timeline', event => event.target.closest('.lane, .ruler')]]) {
    $(id).addEventListener('pointerdown', event => {
        const on = bar(event);
        if (!on || !whole()) return;
        event.preventDefault();
        dragging = true;
        $(id).setPointerCapture(event.pointerId);
        let wanted = momentAt(event, on), busy = false;
        // While dragging, the playhead follows the pointer; the picture catches up when it can.
        const put = () => { $('scrub-head').style.left = $('scrub-fill').style.width = `${100 * wanted / (whole() || 1)}%`; $('clock').textContent = `${(wanted / 1000).toFixed(1)} / ${(whole() / 1000).toFixed(1)} s`; };
        // The picture goes where the pointer stopped, once the page that plays it is there to be told.
        const go = async () => { if (busy) return; busy = true; for (let i = 0; i < 200 && (!span() || frame.contentWindow?.stage?.seeking); i++) await new Promise(done => setTimeout(done, 50)); const to = wanted; await seekTo(to); busy = false; if (to !== wanted) go(); };
        const move = moved => { wanted = momentAt(moved, on); put(); };
        const up = () => { $(id).removeEventListener('pointermove', move); $(id).removeEventListener('pointerup', up); $(id).removeEventListener('pointercancel', up); dragging = false; put(); go(); };
        $(id).addEventListener('pointercancel', up); put();
        $(id).addEventListener('pointermove', move); $(id).addEventListener('pointerup', up);
        go();
    });
}
$('scrub').addEventListener('keydown', event => { const now = span(); if (!now || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); seekTo(now.at + (event.key === 'ArrowLeft' ? -250 : 250)); });
$('resume').addEventListener('click', () => { const s = shown(); if (!s) return; s.playing = true; view.moment = null; showMoment(); $('pause').textContent = t('pause'); note('play'); });
$('restart').addEventListener('click', () => { load(); showMoment(); note('replay'); });
$('panel-close').addEventListener('click', () => advanced(false));

/** Five times a second: the bar, the clock and the bench's sliders follow what is playing. */
export function tick() {
    const s = frame.contentWindow?.stage;
    const now = span();
    // The bar is there whenever what is on show runs in time (an animation, a scene), loaded or not:
    // it must never go away under the hand that holds it. While the picture catches up, it waits where it was put.
    const timed = (view.shop === 'scenes' || view.shop === 'compositions') && !!current() && exists();
    $('scrub').hidden = !timed; $('clock').hidden = !timed;
    $('scrub').classList.toggle('waiting', timed && (!now || !!s?.seeking));
    if (now && !s.seeking && !dragging) {
        const part = now.length ? now.at / now.length : 1;
        $('scrub-fill').style.width = $('scrub-head').style.left = `${100 * part}%`;
        $('scrub').setAttribute('aria-valuenow', String(Math.round(now.at))); $('scrub').setAttribute('aria-valuemax', String(Math.round(now.length || now.at)));
    }
    showMoment();
    const head = $('playhead');
    if (head && s?.ready) head.style.left = `${Math.min(100, 100 * (s.time % Number($('timeline').dataset.length)) / Number($('timeline').dataset.length))}%`;
    // What is on show is still loading: say so.
    $('loading').hidden = view.fresh || !current() || !exists() || !!shown()?.ready;
    if (now && !s.seeking && !dragging) $('clock').textContent = `${(now.at / 1000).toFixed(1)}${now.length ? ' / ' + (now.length / 1000).toFixed(1) : ''} s`;
    else if (!timed) $('clock').textContent = '';
    say();
    if (view.shop !== 'scenes') {
        tools();
        // Moves change the numbers: the sliders follow, unless one is being dragged.
        const bench = frame.contentWindow?.bench;
        if (bench?.ready) for (const input of $('sliders').querySelectorAll('input')) {
            if (document.activeElement !== input) { input.value = bench.get(input.dataset.key); input.nextElementSibling.textContent = bench.get(input.dataset.key).toFixed(2); }
        }
    }
}
