// What the person does in the atelier, noted silently: which section they
// open, what they look at and for how long, what they replay or slow down,
// which style they choose. Nothing reacts to it and nobody is woken by it; an
// assistant reads a summary when it next looks, so that it knows what the
// person has in mind before they say it. Never what they type. One file,
// fiches/.activity, on this machine only, kept short.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const KINDS = ['open', 'pick', 'play', 'pause', 'replay', 'step', 'speed', 'width', 'style', 'every', 'language', 'pin', 'order-open', 'order-sent', 'order-cancel', 'draw', 'new', 'advanced', 'version', 'seek', 'export', 'board'];
const SHOPS = ['scenes', 'characters', 'emoji', 'props', 'compositions', 'draw'];
const NAME = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const KEEP = 400;
/** Looking at one thing for longer than this is a pause away from the screen, not attention. */
const LONGEST = 5 * 60_000;

/** An event as the journal keeps it: known kinds and plain names only, or null. */
export function clean(event) {
    if (!event || typeof event !== 'object' || !KINDS.includes(event.what)) return null;
    const out = { what: event.what };
    if (SHOPS.includes(event.shop)) out.shop = event.shop;
    for (const key of ['item', 'cast']) if (typeof event[key] === 'string' && NAME.test(event[key])) out[key] = event[key];
    if (typeof event.value === 'number' && Number.isFinite(event.value)) out.value = event.value;
    else if (typeof event.value === 'string' && NAME.test(event.value)) out.value = event.value;
    return out;
}

const file = dir => join(dir, '.activity');

export async function readActivity(dir) {
    let text = '';
    try { text = await readFile(file(dir), 'utf8'); } catch { return []; }
    return text.split('\n').flatMap(line => { try { return line ? [JSON.parse(line)] : []; } catch { return []; } });
}

/** Adds events (dated here), and keeps only the latest. Returns how many were kept. */
export async function noteActivity(dir, events) {
    const fresh = (Array.isArray(events) ? events.slice(0, 200) : []).map(clean).filter(Boolean).map(event => ({ at: new Date().toISOString(), ...event }));
    if (!fresh.length) return 0;
    const all = [...await readActivity(dir), ...fresh].slice(-KEEP);
    await mkdir(dir, { recursive: true });
    await writeFile(file(dir), all.map(event => JSON.stringify(event)).join('\n') + '\n');
    return fresh.length;
}

const span = ms => {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`;
};
const SPEEDS = { 0.5: '½', 0.25: '¼' };

/**
 * A few lines an assistant can read at a glance: what was looked at, for how
 * long and how (replayed, slowed down), and what else was done.
 * @param {object[]} events as readActivity gives them
 * @param {{ now?: number }} [options]
 */
export function summarise(events, { now = Date.now() } = {}) {
    if (!events.length) return ['The person has done nothing in the atelier yet.'];
    const items = new Map(), other = [];
    let on = null, since = 0, shop = null, ordering = null;
    const leave = until => { if (on) on.ms += Math.min(LONGEST, Math.max(0, until - since)); };
    for (const event of events) {
        const at = Date.parse(event.at);
        if (event.what === 'open') shop = event.shop ?? shop;
        else if (event.what === 'pick' && event.item) {
            leave(at);
            shop = event.shop ?? shop;
            const key = `${shop}/${event.item}`;
            if (!items.has(key)) items.set(key, { key, cast: event.cast, ms: 0, replay: 0, step: false, speeds: new Set() });
            on = items.get(key); since = at;
        } else if (event.what === 'replay') { if (on) on.replay++; }
        else if (event.what === 'step') { if (on) on.step = true; }
        else if (event.what === 'seek') { if (on && typeof event.value === 'number') (on.seeks ??= []).push(event.value); }
        else if (event.what === 'speed') { if (on && event.value !== 1) on.speeds.add(event.value); }
        else if (event.what === 'style') other.push(`style → ${event.value ?? '?'}`);
        else if (event.what === 'order-open') ordering = event.shop ?? shop;
        else if (event.what === 'order-cancel') { other.push(`opened the order form (${ordering ?? '?'}), cancelled`); ordering = null; }
        else if (event.what === 'order-sent') { other.push(`sent an order (${ordering ?? event.shop ?? '?'})`); ordering = null; }
        else if (event.what === 'new') other.push(`pressed "New" (${event.shop ?? shop ?? '?'})`);
        else if (event.what === 'advanced' && event.value) other.push('opened Advanced');
        else if (event.what === 'version') other.push(event.value === -1 ? 'came back to the present version' : 'looked at an earlier version');
        else if (event.what === 'board') other.push(event.value === 'legs' ? 'gave legs to a drawing' : event.value === 'order' ? 'ordered a character from a drawing' : 'opened the whiteboard');
        else if (event.what === 'export') other.push(`exported ${event.shop ?? '?'}/${event.item ?? '?'}`);
        else if (event.what === 'draw') other.push('drew on the whiteboard');
        else if (event.what === 'pin') other.push('pointed at a spot');
    }
    leave(now);
    const first = events[0].at.slice(0, 16).replace('T', ' ');
    const lines = [`What the person did in the atelier since ${first} UTC (noted silently; they were not asked anything):`];
    for (const item of [...items.values()].sort((a, b) => b.ms - a.ms).slice(0, 8)) {
        const how = [
            item.replay ? `replayed ${item.replay}×` : '',
            ...[...item.speeds].map(speed => `slowed to ${SPEEDS[speed] ?? speed}`),
            item.step ? 'frame by frame' : '',
            item.seeks?.length ? `stopped at ${[...new Set(item.seeks.slice(-3).map(ms => (ms / 1000).toFixed(1) + ' s'))].join(', ')}` : '',
        ].filter(Boolean);
        lines.push(`- ${item.key}${item.cast ? ` (played by ${item.cast})` : ''}: ${span(item.ms)}${how.length ? ', ' + how.join(', ') : ''}`);
    }
    for (const line of [...new Set(other)].slice(-6)) lines.push(`- ${line}`);
    if (on) lines.push(`Now on ${on.key}.`);
    return lines;
}
