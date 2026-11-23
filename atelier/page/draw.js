// Drawing the page from what is known. `draw()` is called after anything
// changes: it is cheap, and every part writes only its own corner of the page.

import { t, language } from '../i18n.js';
import { $, el } from './dom.js';
import { SHOPS, everyone, castNames, view, styleBook, current, talkName, label, asked, styleOf, inStyle, listing } from './project.js';
import { drawList } from './list.js';
import { shown, say } from './stage.js';
import { timeline } from './timeline.js';
import { drawTalk } from './talk.js';
import { waiting } from './assistant.js';
import { before } from './versions.js';
import { customise } from './custom.js';
import { boardDraw } from './whiteboard.js';

export function draw() {
    listing();
    drawChrome();
    drawList();
    drawSettings();
    timeline();
    customise();
    waiting();
    before();
    drawTalk();
    say();
}

/** The tabs, the language, the play button. */
function drawChrome() {
    $('pause').textContent = t(shown()?.playing === false ? 'play' : 'pause');
    for (const button of document.querySelectorAll('[data-lang]')) button.setAttribute('aria-pressed', String(button.dataset.lang === language()));
    for (const tab of document.querySelectorAll('[data-shop]')) tab.setAttribute('aria-selected', String(!view.board && tab.dataset.shop === view.shop));
    queueMicrotask(boardDraw);
}

/** The settings beside the picture: what applies to the workshop on show, and what is being worked on. */
function drawSettings() {
    const scenes = view.shop === 'scenes';
    $('more').setAttribute('aria-expanded', String(!$('advanced').hidden));
    const hidden = ['characters', 'emoji', 'props'].reduce((n, key) => n + SHOPS[key].all.length, 0) - Object.keys(everyone).filter(name => inStyle('characters', name)).length - SHOPS.props.all.filter(name => inStyle('props', name)).length;
    $('every').hidden = !view.every && hidden === 0;
    $('every').textContent = t(view.every ? 'every.off' : 'every.on');
    $('widths').hidden = !(scenes || view.shop === 'compositions');
    $('elements').hidden = !scenes;
    $('bench-tools').hidden = scenes || view.shop === 'compositions';
    $('moves').hidden = $('bench-tools').hidden;
    for (const button of document.querySelectorAll('[data-width]')) button.setAttribute('aria-pressed', String(Number(button.dataset.width) === view.width));
    for (const button of document.querySelectorAll('[data-speed]')) button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === view.speed));
    const fiche = view.fiches[talkName()] || { status: 'draft', entries: [] };
    $('scene-name').textContent = current() ? label(view.shop, current()) : '';
    // What is being worked on, said plainly: its kind, whose it is, its style.
    const owner = view.shop === 'scenes' ? view.cast : null;
    const itemStyle = view.shop === 'scenes' ? styleOf('characters', view.cast) : styleOf(view.shop, current());
    const styleName = styleBook.styles.find(style => style.id === itemStyle)?.name;
    $('context').replaceChildren(...(current() ? [
        el('span', { className: 'kind', textContent: t(`kind.${view.shop}`) }),
        ...(owner ? [el('span', { textContent: t('context.of', { name: owner }) })] : []),
        el('span', { textContent: styleName ? t('context.style', { name: styleName }) : t('context.nostyle') }),
    ] : []));
    $('status').textContent = t(`status.${fiche.status}`);
    $('status-dot').className = `dot ${asked(fiche) ? 'asked' : fiche.status}`;
    if (!$('pick-props').children.length) {
        const pick = (name, kind) => el('label', {}, el('input', { type: 'checkbox', value: name, name: kind }), ' ' + name);
        $('pick-props').replaceChildren(...SHOPS.props.made.map(name => pick(name, 'prop')));
        $('pick-cast').replaceChildren(...castNames.map(name => pick(name, 'cast')));
    }
}
