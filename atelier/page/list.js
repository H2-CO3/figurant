// The list beside the picture: the items of the workshop on show, each with
// its picture, and for an animation the character who plays it.

import { t } from '../i18n.js';
import { readable } from '../orders.js';
import { $, el, keep } from './dom.js';
import { SHOPS, castNames, view, current, label, asked } from './project.js';
import { note, here } from './activity.js';
import { draw } from './draw.js';
import { load } from './stage.js';
import { thumbs, keptThumb, thumbnail } from './thumbs.js';

/** The items of the workshop on show, and who plays. */
export function drawList() {
    const shop = SHOPS[view.shop], scenes = view.shop === 'scenes';
    $('items').replaceChildren(...shop.names.map(name => {
        const fiche = view.fiches[shop.fiche(name)];
        const status = fiche?.status || 'draft';
        const made = shop.made.includes(name);
        const state = !made ? 'todo' : asked(fiche) ? 'asked' : status;
        const common = view.shop === 'scenes' && view.gestures?.includes(name);
        const tag = el('span', { className: 'tag', textContent: state !== 'draft' ? t(`tag.${state}`) : common ? t('tag.gesture') : '' });
        // A picture of it.
        // An animation and a scene are shown by a moment of them.
        const who = view.shop === 'scenes' ? ['scene', name, view.cast] : view.shop === 'compositions' ? ['show', name] : [view.shop === 'props' ? 'prop' : 'character', name];
        // (An effect has no still picture: it is a moment.)
        const pictured = made && view.shop !== 'effects';
        // The picture drawn this time, or meanwhile the one kept from last time.
        const source = pictured ? thumbs.get(who.join(':')) || keptThumb(who.join(':')) || thumbs.get(who.join(':')) : null;
        if (pictured && !thumbs.has(who.join(':'))) thumbnail(...who);
        // Being drawn: a loader in its place. No picture to be had: its dot.
        const picture = source ? el('img', { className: 'thumb', src: source, alt: '' }) : pictured && source !== false ? el('span', { className: 'spinner thumb-wait' }) : el('span', { className: `dot ${state}` });
        const button = el('button', { type: 'button' }, picture, el('span', { className: 'name', textContent: label(view.shop, name) }), tag);
        button.title = name;
        button.classList.toggle('film', view.shop === 'compositions');
        button.setAttribute('aria-current', String(name === current()));
        button.addEventListener('click', () => { view.item[view.shop] = name; keep('item.' + view.shop, name); view.fresh = false; draw(); load(); note('pick', here()); });
        return button;
    }));
    $('new').setAttribute('aria-pressed', String(!!view.fresh));
    $('cast-label').hidden = !scenes;
    // Who plays, pictured beside their name.
    const face = thumbs.get(`character:${view.cast}`) || keptThumb(`character:${view.cast}`);
    if (scenes && !thumbs.has(`character:${view.cast}`)) thumbnail('character', view.cast);
    $('cast-face').replaceChildren(face ? el('img', { src: face, alt: '' }) : el('span', { className: 'spinner' }));
    $('cast').replaceChildren(...castNames.map(name => el('option', { value: name, textContent: readable(name), selected: name === view.cast })));
}

for (const tab of document.querySelectorAll('[data-shop]')) {
    tab.addEventListener('click', () => { view.board = false; view.shop = tab.dataset.shop; keep('shop', view.shop); view.fresh = false; draw(); load(); note('open', { shop: view.shop }); note('pick', here()); });
}
$('cast').addEventListener('change', event => { view.cast = event.target.value; keep('cast', view.cast); draw(); load(); note('pick', here()); });
$('every').addEventListener('click', () => { view.every = !view.every; keep('every', view.every ? '1' : '0'); draw(); load(); });
