import { t } from '../i18n.js';
import { SHEET, outline, smooth, tidy, toSvg } from '../board.js';
import { orderName } from '../orders.js';
import { $, el, keep, api } from './dom.js';
import { config, SHOPS, view, styleBook, whereOf, go } from './project.js';
import { note } from './activity.js';
import { draw } from './draw.js';
import { shown, load } from './stage.js';
import { order, ready } from './talk.js';
import { themeOf } from './styles.js';
import { forgetCustom } from './custom.js';

// ── The whiteboard: the work zone as a sheet to draw on. A drawing can be given
// legs at once (it becomes the head of the figure that wears pictures), or sent
// with a few words for the assistant to make a character of it. ──────────────
const pen = { colour: null, size: 7, eraser: false, strokes: [], live: null };
try { pen.strokes = tidy(JSON.parse(localStorage.getItem('figurant.board') || '[]')); } catch { /* nothing kept */ }
const sheet = $('sheet');
const NS = 'http://www.w3.org/2000/svg';
const inkOf = stroke => { const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', stroke.colour); path.setAttribute('d', outline(smooth(stroke.points), stroke.size)); return path; };
const boardKeep = () => { keep('board', JSON.stringify(pen.strokes)); /* (the page redraws itself now and then: the line being drawn stays on the sheet) */ sheet.replaceChildren(...pen.strokes.map(inkOf), ...(pen.live?.node ? [pen.live.node] : [])); $('board-hint').hidden = pen.strokes.length > 0 || !!pen.live?.node; $('board-undo').disabled = $('board-clear').disabled = $('board-legs').disabled = !pen.strokes.length; };
/** The figure that wears a picture for a head, if the project has one. */
const wearer = () => Object.keys(config.custom || {}).find(name => config.emoji?.[name]) ?? Object.keys(config.custom || {})[0] ?? null;
export function boardDraw() {
    const on = !!view.board;
    document.querySelector('.layout').classList.toggle('board', on);
    $('board-open').setAttribute('aria-selected', String(on));
    for (const id of ['board', 'board-bar', 'board-tools']) $(id).hidden = !on;
    if (!on) return;
    $('last-word').textContent = t('board.say'); $('note').placeholder = t('board.note');
    $('board-legs').hidden = !wearer();
    const theme = themeOf(styleBook.styles.find(style => style.id === styleBook.active));
    const colours = [...new Set([theme.ink, theme.accent, theme.pop, '#e03131', '#f08c00', '#2f9e44', '#1c7ed6', '#ffffff'].map(colour => colour.toLowerCase()))];
    if (!colours.includes(pen.colour)) pen.colour = colours[0];
    $('board-colours').replaceChildren(...colours.map(colour => {
        const button = el('button', { type: 'button', style: `background:${colour}` });
        button.setAttribute('role', 'radio'); button.setAttribute('aria-label', colour); button.setAttribute('aria-checked', String(!pen.eraser && colour === pen.colour));
        button.addEventListener('click', () => { pen.colour = colour; pen.eraser = false; boardDraw(); });
        return button;
    }));
    $('board-sizes').replaceChildren(...[3, 7, 14, 28].map(size => {
        const button = el('button', { type: 'button' }, el('i', { style: `width:${size}px;height:${size}px` }));
        button.setAttribute('role', 'radio'); button.setAttribute('aria-label', String(size)); button.setAttribute('aria-checked', String(size === pen.size));
        button.addEventListener('click', () => { pen.size = size; boardDraw(); });
        return button;
    }));
    $('board-eraser').setAttribute('aria-pressed', String(pen.eraser));
    sheet.classList.toggle('erasing', pen.eraser);
    boardKeep();
    document.querySelector('.layout').style.setProperty('--zone', `${document.querySelector('main').offsetHeight}px`);
}
const sheetPoint = event => {
    const at = new DOMPoint(event.clientX, event.clientY).matrixTransform(sheet.getScreenCTM().inverse());
    return { x: Math.min(SHEET.width, Math.max(0, at.x)), y: Math.min(SHEET.height, Math.max(0, at.y)), p: event.pointerType === 'mouse' ? 0.5 : event.pressure || 0.5 };
};
const rub = event => { const hit = document.elementFromPoint(event.clientX, event.clientY); const at = [...sheet.children].indexOf(hit); if (at >= 0) { pen.strokes.splice(at, 1); boardKeep(); } };
sheet.addEventListener('pointerdown', event => {
    if (event.button > 0) return;
    event.preventDefault(); sheet.setPointerCapture(event.pointerId);
    if (pen.eraser) { pen.live = { rubbing: true }; rub(event); return; }
    pen.live = { stroke: { colour: pen.colour, size: pen.size, points: [sheetPoint(event)] }, node: null };
    pen.live.node = sheet.appendChild(inkOf(pen.live.stroke)); $('board-hint').hidden = true;
});
sheet.addEventListener('pointermove', event => {
    if (!pen.live) return;
    if (pen.live.rubbing) { rub(event); return; }
    const points = pen.live.stroke.points;
    // A stylus says more than once per frame where it is: every word of it is kept.
    const parts = event.getCoalescedEvents?.() ?? [];
    for (const part of parts.length ? parts : [event]) { const next = sheetPoint(part), last = points.at(-1); if (Math.hypot(next.x - last.x, next.y - last.y) >= 1.5) points.push(next); }
    pen.live.node.setAttribute('d', outline(smooth(points), pen.live.stroke.size));
});
const lift = () => { if (pen.live?.stroke) { pen.strokes.push(pen.live.stroke); } const drew = !!pen.live; pen.live = null; if (drew) boardKeep(); };
sheet.addEventListener('pointerup', lift); sheet.addEventListener('pointercancel', lift);
$('board-open').addEventListener('click', () => { if (shown()) shown().playing = false; view.board = true; view.fresh = false; draw(); note('board', { value: 'open' }); });
$('board-undo').addEventListener('click', () => { pen.strokes.pop(); boardKeep(); });
$('board-clear').addEventListener('click', () => { pen.strokes = []; boardKeep(); });
$('board-eraser').addEventListener('click', () => { pen.eraser = !pen.eraser; boardDraw(); });
/** Saves the drawing among the project's pictures; returns where. */
async function boardSave() {
    const svg = toSvg(pen.strokes);
    if (!svg) throw new Error(t('board.empty'));
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    return (await api(`assets/drawing-${stamp}.svg`, { method: 'POST', headers: { 'content-type': 'image/svg+xml' }, body: svg })).path;
}
$('board-legs').addEventListener('click', async () => {
    const name = wearer();
    if (!name) return;
    try {
        const image = await boardSave();
        const now = await api(`custom/${encodeURIComponent(name)}`).catch(() => ({}));
        await api(`custom/${encodeURIComponent(name)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ face: now.face || '🙂', faces: now.faces || {}, image }) });
        note('board', { value: 'legs' });
        forgetCustom(); go(config.emoji?.[name] ? 'emoji' : 'characters', name);
        draw(); load(); $('saved').textContent = t('board.walking');
    } catch (error) { $('saved').textContent = t('board.failed', { error: error.message }); }
});
export async function boardOrder() {
    const text = $('note').value.trim();
    if (!text) return;
    try {
        const path = await boardSave();
        const inUse = styleBook.styles.find(style => style.id === styleBook.active);
        const lines = [...(inUse ? [`Style: ${inUse.name} (${inUse.id})`] : []), `Drawing to start from: ${path}`, text];
        const taken = Object.keys(view.fiches).map(name => whereOf(name)).filter(([shop]) => shop === 'characters').map(([, name]) => name);
        view.board = false;
        await order(orderName(text, [...SHOPS.characters.all, ...taken]), lines.join('\n'), 'characters');
        $('note').value = ''; note('board', { value: 'order' }); note('order-sent', { shop: 'characters' });
    } catch (error) { $('saved').textContent = t('board.failed', { error: error.message }); }
    draw(); ready();
}
