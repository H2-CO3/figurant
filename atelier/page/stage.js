// The work zone: the page that plays what is on show (a scene's stage, a
// scene in time, or the bench for a character or a prop), its size, and the
// buttons that drive it: pause, step, speed, screen width.

import { t } from '../i18n.js';
import { $, el, keep } from './dom.js';
import { config, SHOPS, everyone, view, current, ficheName, label, exists, made } from './project.js';
import { note } from './activity.js';
import { draw } from './draw.js';
import { past } from './versions.js';
import { stageTheme } from './styles.js';

export const frame = $('frame');
/** The page on show: a scene's stage or the bench. Both pause, step and take a speed. */
export const shown = () => frame.contentWindow?.stage || frame.contentWindow?.bench;

let slidersFor = null;
/** The page that plays what is on show: the present version or an earlier one (a commit), with what else it must be told. */
export function address(commit, more = {}) {
    const also = { ...stageTheme(), ...(commit ? { config: `/__figurant/at/${commit}/figurant.config.js` } : {}), ...more };
    return view.shop === 'compositions' ? `show.html?${new URLSearchParams({ scene: current(), speed: view.speed, ...also })}` : view.shop === 'scenes'
        ? `stage.html?${new URLSearchParams({ scene: current(), cast: view.cast, speed: view.speed, ...also })}`
        : `bench.html?${new URLSearchParams({ kind: view.shop === 'props' ? 'prop' : 'character', name: current(), ...also })}`;
}
/** What can play on the stage while something new is being asked for: the stick figure's own, each with the request that made it (i18n: demo.<name>). */
const DEMOS = [{ shop: 'compositions', name: 'duel-dance' }, { shop: 'scenes', name: 'tap-dance-stickman', cast: 'stickman' }, { shop: 'scenes', name: 'notes', cast: 'stickman' }, { shop: 'scenes', name: 'hello', cast: 'stickman' }];
/** The example on show: chosen when the person starts asking (the fullest one on a first visit, any after), from those the project has. */
function demo() {
    if (view.shop !== 'scenes' && view.shop !== 'compositions') return null;
    if (view.demo === undefined) {
        const there = DEMOS.filter(example => made(example.shop, example.name) && (!example.cast || everyone[example.cast]));
        view.demo = there.length ? there[view.first ? 0 : Math.floor(Math.random() * there.length)] : null;
    }
    return view.demo;
}
export function load() {
    const scenes = view.shop === 'scenes';
    const wide = scenes || view.shop === 'compositions';
    const width = wide ? view.width : 900;
    const height = scenes ? ({ 360: 740, 768: 900, 1440: 810 }[view.width] || 800) : wide ? ({ 360: 560, 768: 600, 1440: 560 }[view.width] || 560) : 520;
    frame.width = width; frame.height = height;
    const box = $('viewport');
    // The stage takes the width it has, up to a height that leaves the strip in view; no empty band under it.
    // The picture gets what is left between the top of the page and the conversation afloat at the bottom, so that neither covers the other.
    const zone = document.querySelector('main'), dock = $('dock').offsetHeight;
    // (The top is where the page's heading ends, not where the zone happens to be: the whole is centred in what is left.)
    // (The settings are a column beside the picture: opening them moves nothing.)
    const rest = zone.offsetHeight - box.offsetHeight, top = document.querySelector('header').offsetHeight + 12;
    const tallest = Math.max(220, Math.min(600, innerHeight - dock - 58 - top - rest));
    // Whatever is taller than the screen scrolls clear of the conversation.
    box.style.width = '';
    const scale = Math.min(box.clientWidth / width, tallest / height, 1);
    box.style.height = `${Math.round(height * scale)}px`;
    // The stage is the picture and nothing else: no band beside it.
    box.style.width = `${Math.round(width * scale)}px`;
    // The list beside the picture and the controls on the other side are as tall as the work zone, and scroll inside.
    document.querySelector('.layout').style.setProperty('--zone', `${zone.offsetHeight}px`);
    frame.style.transform = `scale(${scale})`;
    frame.style.left = '0px';
    slidersFor = null;
    // Something new is being asked for: the stage is a blank slate that says so.
    $('blank').hidden = !view.fresh;
    $('transport').hidden = !!view.fresh;
    $('blank-say').textContent = t(`fresh.${view.shop}`);
    if (view.fresh) {
        // Not an empty stage: an example plays on it, with the request that made it.
        const example = demo();
        $('blank').classList.toggle('demo', !!example);
        $('blank-demo').textContent = example ? t('demo.made', { prompt: t(`demo.${example.name}`) }) : '';
        const src = example ? `${example.shop === 'compositions' ? 'show' : 'stage'}.html?${new URLSearchParams({ scene: example.name, ...(example.cast ? { cast: example.cast } : {}), ...stageTheme(), mute: 1 })}` : 'about:blank';
        if (frame.getAttribute('src') !== src) frame.src = src;
        return;
    }
    if (!current() || !exists()) { frame.src = 'about:blank'; return; }
    frame.src = address(past.at === null ? null : past.steps[past.at], view.seek ? { seek: Math.round(view.seek) } : {});
    if (!view.seek) view.moment = null;
    view.seek = 0;
    $('pause').textContent = t('pause');
}

/** The one line under the stage: what is missing, or what is wrong with what is shown. One place writes it. */
export function say() {
    const shop = SHOPS[view.shop];
    const text = !shop.names.length ? t(`empty.${view.shop}`)
        : !exists() ? t(view.fiches[ficheName()]?.entries.at(-1)?.author === 'llm' ? 'ordered.made' : 'ordered.waiting', { name: label(view.shop, current()) })
        : (shown()?.problems || []).join('\n');
    if ($('problems').textContent !== text) $('problems').textContent = text;
}

/** The bench's numbers as sliders, its moves as buttons. Built once per item. */
export function tools() {
    const bench = frame.contentWindow?.bench;
    if (!bench?.ready || slidersFor === bench) return;
    slidersFor = bench;
    bench.speed = view.speed;
    bench.marks = $('marks').checked;
    $('moves').replaceChildren(...bench.moves.map(move => {
        const button = el('button', { type: 'button', textContent: t(`move.${move}`) });
        button.dataset.move = move;
        button.addEventListener('click', () => bench.play(move));
        return button;
    }));
    $('sliders').replaceChildren(...bench.numbers.map(({ key, min, max }) => {
        const output = el('output', { textContent: bench.get(key).toFixed(2) });
        const input = el('input', { type: 'range', min, max, step: (max - min) / 100, value: bench.get(key) });
        input.dataset.key = key;
        input.addEventListener('input', () => { bench.set(key, input.value); output.textContent = Number(input.value).toFixed(2); });
        return el('label', {}, el('span', { textContent: key }), input, output);
    }));
}
/** The bench's tools are built again the next time they are looked at (the language has changed). */
export const forgetTools = () => { slidersFor = null; };

for (const button of document.querySelectorAll('[data-width]')) {
    button.addEventListener('click', () => { view.width = Number(button.dataset.width); keep('width', view.width); note('width', { value: view.width }); draw(); load(); });
}
for (const button of document.querySelectorAll('[data-speed]')) {
    button.addEventListener('click', () => { view.speed = Number(button.dataset.speed); keep('speed', view.speed); note('speed', { value: view.speed }); if (shown()) shown().speed = view.speed; draw(); });
}
$('pause').addEventListener('click', () => {
    if (!shown()) return;
    shown().playing = !shown().playing;
    note(shown().playing ? 'play' : 'pause');
    $('pause').textContent = t(shown().playing ? 'pause' : 'play');
});
$('step').addEventListener('click', () => { note('step'); shown()?.step?.(); $('pause').textContent = t('play'); });
$('replay').addEventListener('click', () => { load(); note('replay'); });
$('marks').addEventListener('change', () => { if (frame.contentWindow?.bench) frame.contentWindow.bench.marks = $('marks').checked; });
addEventListener('resize', load);
