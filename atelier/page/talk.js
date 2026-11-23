// The conversation: the one box to write in, what the message is about (what
// is on show, something new, the page itself), the assistant's last word and
// its questions, and the detailed order form. What is written goes to a fiche
// (a file), which the assistant reads.

import { t, language } from '../i18n.js';
import { fulfilled, nameFor, conversation, orderName } from '../orders.js';
import { $, el, keep, api } from './dom.js';
import { SHOPS, castNames, view, styleBook, INTERFACE, current, talkName, label, exists, whereOf, isMade, go } from './project.js';
import { note, here } from './activity.js';
import { draw } from './draw.js';
import { shown, load } from './stage.js';
import { before } from './versions.js';
import { pins, clearPins, pinned } from './pins.js';
import { boardOrder } from './whiteboard.js';

/** Writes an order for something that does not exist yet, and shows it. */
export async function order(name, text, shop = 'scenes') {
    const fiche = SHOPS[shop].fiche(name);
    view.fiches[fiche] = await api(`fiches/${encodeURIComponent(fiche)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'brief', note: text }),
    });
    view.shop = shop; view.item[shop] = name;
    $('saved').textContent = t('saved.ordered');
    draw(); load();
}

/** How many answers the LLM has written, over all fiches. */
const answers = fiches => Object.values(fiches).reduce((n, fiche) => n + fiche.entries.filter(entry => entry.author === 'llm').length, 0);
let answered = null;

export async function refresh() {
    try { view.fiches = await api('fiches'); } catch (error) { $('saved').textContent = error.message; }
    // The LLM answered: what it changed lives in the project's files, which this
    // page read once. Reload, so that what is shown is what it made. Not while
    // the person is typing or ordering: their words would be lost.
    const now = answers(view.fiches);
    const busy = $('note').value.trim() || $('composer').open || $('style').open || $('style-edit').open || pins.length || $('questions').querySelector('[aria-pressed="true"]');
    if (answered !== null && now > answered && !busy) { keep('reloaded', '1'); location.reload(); return; }
    if (answered === null || !busy) answered = now;
    draw();
}

// The order form: a name, the elements to use, and what is wanted, in plain words.
// "+ New": the next message asks for something that does not exist yet.
const fresh = on => { view.aside = false; view.fresh = on; draw(); load(); ready(); if (on) { $('note').focus(); note('new', { shop: view.shop }); } };
$('new').addEventListener('click', () => fresh(true));
$('about-new').addEventListener('click', () => fresh(true));
$('about-this').addEventListener('click', () => fresh(false));
// A remark about the page itself goes to a fiche of its own, whatever is on show.
$('about-interface').addEventListener('click', () => { fresh(false); view.aside = true; draw(); ready(); $('note').focus(); });
// Advanced: the fine settings, in the conversation's panel, which grows to hold them.
export const advanced = open => {
    $('advanced').hidden = !open; document.querySelector('.layout').classList.toggle('wide', open);
    $('more').setAttribute('aria-expanded', String(open)); keep('advanced', open ? '1' : '0');
};
$('history').addEventListener('click', () => { $('thread').hidden = !$('thread').hidden; $('history').setAttribute('aria-expanded', String(!$('thread').hidden)); draw(); $('thread').scrollTop = $('thread').scrollHeight; });
$('more').addEventListener('click', () => { advanced($('advanced').hidden); before(); note('advanced', { value: $('advanced').hidden ? 0 : 1 }); });
$('detailed').addEventListener('click', () => {
    const shop = SHOPS[view.shop];
    $('compose-title').textContent = t('new.title', { noun: t(`noun.${view.shop}`) });
    $('new-scene-fields').hidden = view.shop !== 'scenes';
    $('new-cast-pick').hidden = view.shop !== 'compositions';
    $('new-cast-list').replaceChildren(...castNames.map(name => el('label', {}, el('input', { type: 'checkbox', value: name }), ' ' + name)));
    $('new-drawing-label').hidden = ['scenes', 'emoji', 'compositions'].includes(view.shop);
    $('new-cast').replaceChildren(...castNames.map(name => el('option', { value: name, textContent: name, selected: name === view.cast })));
    $('new-props').replaceChildren(...SHOPS.props.made.map(name => el('label', {}, el('input', { type: 'checkbox', value: name }), ' ' + name)));
    $('compose-error').textContent = '';
    $('composer').showModal();
    note('order-open', { shop: view.shop });
});
$('compose-cancel').addEventListener('click', () => { $('composer').close(); note('order-cancel'); });
$('compose').addEventListener('submit', async event => {
    event.preventDefault();
    // Any words will do as a name: the file gets a safe one, and theirs is kept to be shown.
    const shop = SHOPS[view.shop], typed = $('new-name').value.replace(/\s+/g, ' ').trim(), name = nameFor(typed);
    if (!name) { $('compose-error').textContent = t('name.bad'); return; }
    if (shop.names.includes(name)) { $('compose-error').textContent = t('exists.already', { noun: t(`noun.${view.shop}`), name }); return; }
    const lines = typed === name ? [] : [`Name: ${typed}`];
    const inUse = styleBook.styles.find(style => style.id === styleBook.active);
    if (inUse) lines.push(`Style: ${inUse.name} (${inUse.id})`);
    if (view.shop === 'compositions') {
        const who = [...$('new-cast-list').querySelectorAll('input:checked')].map(input => input.value);
        if (who.length) lines.push(`Cast: ${who.join(', ')}`);
    }
    if (view.shop === 'scenes') {
        const props = [...$('new-props').querySelectorAll('input:checked')].map(input => input.value);
        lines.push(`Character: ${$('new-cast').value}`);
        if (props.length) lines.push(`Props to use: ${props.join(', ')}`);
        lines.push(`Starts when: ${$('new-on').value}`, `Tone: ${$('new-mood').value}`);
    }
    try {
        const drawing = $('new-drawing').files[0];
        if (drawing) {
            const { path } = await api(`assets/${encodeURIComponent(drawing.name)}`, { method: 'POST', headers: { 'content-type': drawing.type || 'application/octet-stream' }, body: drawing });
            lines.push(`Drawing to start from: ${path}`);
        }
        if (view.shop === 'scenes') { view.cast = $('new-cast').value; keep('cast', view.cast); }
        await order(name, [...lines, $('new-text').value].join('\n'), view.shop);
        note('order-sent', { shop: view.shop });
        $('compose').reset();
        $('composer').close();
    } catch (error) { $('compose-error').textContent = error.message; }
});

/** The elements ticked under "Add elements already made", as lines for the fiche. */
const picked = () => {
    const names = kind => [...$('elements').querySelectorAll(`input[name="${kind}"]:checked`)].map(input => input.value);
    return [names('prop').length ? `Props to use: ${names('prop').join(', ')}` : '', names('cast').length ? `Characters to add: ${names('cast').join(', ')}` : ''];
};

/** Something to send: an answer, a word, or a pin. */
const something = () => !!($('note').value.trim() || pins.length || $('questions').querySelector('[aria-pressed="true"]') || $('elements').querySelector('input:checked'));
export const ready = () => { document.querySelector('[data-decision="redo"]').disabled = !something(); };
$('say').addEventListener('input', ready);
$('say').addEventListener('click', () => setTimeout(ready));
$('pins').addEventListener('click', () => setTimeout(ready));

$('say').addEventListener('submit', async event => {
    event.preventDefault();
    let decision = event.submitter?.dataset.decision || 'note';
    // On the whiteboard, the message says what the drawing is: an order for a character, with the drawing.
    if (view.board) { await boardOrder(); return; }
    // About the page itself: a remark in its own fiche, with where the person was.
    if (view.aside) {
        const text = $('note').value.trim();
        if (!text) return;
        try {
            view.fiches[INTERFACE] = await api(`fiches/${INTERFACE}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'redo', note: `About: the atelier's own page (seen from ${view.shop}/${current() ?? ''})\n${text}` }) });
            $('note').value = ''; view.aside = false; $('saved').textContent = t('saved.interface'); note('order-sent', { shop: view.shop });
        } catch (error) { $('saved').textContent = t('saved.failed', { error: error.message }); }
        draw(); ready();
        return;
    }
    // Something new: the message is the order. It is named from its first words.
    if (view.fresh) {
        const text = $('note').value.trim();
        if (!text) return;
        const lines = [];
        const inUse = styleBook.styles.find(style => style.id === styleBook.active);
        if (inUse) lines.push(`Style: ${inUse.name} (${inUse.id})`);
        if (view.shop === 'scenes' && view.cast) lines.push(`Character: ${view.cast}`);
        try {
            const taken = Object.keys(view.fiches).map(name => whereOf(name)).filter(([shop]) => shop === view.shop).map(([, name]) => name);
            view.fresh = false;
            $('blank').hidden = true;
            await order(orderName(text, [...SHOPS[view.shop].all, ...taken]), [...lines, text].join('\n'), view.shop);
            $('note').value = ''; note('order-sent', { shop: view.shop });
        } catch (error) { view.fresh = true; $('saved').textContent = t('order.failed', { error: error.message }); }
        draw(); ready();
        return;
    }
    // "It is right", said with a request beside it, is a request.
    if (decision === 'approve' && $('note').value.trim()) decision = 'redo';
    if (decision === 'redo' && !something()) return;
    const answers = [...$('questions').children].map(row => ({ question: row.dataset.question, answer: row.dataset.answer || '' }));
    try {
        const talk = talkName();
        view.fiches[talk] = await api(`fiches/${encodeURIComponent(talk)}`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ decision, note: [...(view.moment != null && shown()?.playing === false && decision !== 'approve' ? [`At: ${(view.moment / 1000).toFixed(1)} s`] : []), ...picked(), ...pinned(), $('note').value].filter(Boolean).join('\n'), answers }),
        });
        $('note').value = '';
        clearPins();
        for (const input of $('elements').querySelectorAll('input:checked')) input.checked = false;
        $('saved').textContent = t(decision === 'approve' ? 'saved.approved' : 'saved.written');
    } catch (error) {
        $('saved').textContent = t('saved.failed', { error: error.message });
    }
    draw();
    ready();
});

/** The conversation as it stands: the thread, what the message is about, the last word, the questions. */
export function drawTalk() {
    const fiche = view.fiches[talkName()] || { status: 'draft', entries: [] };
    $('questions').dataset.title = t('questions.title');
    // One conversation: everything said, about anything, in order of time. Each
    // line says what it was about; a click on that goes there.
    const said = conversation(view.fiches, 40);
    const signatureOfThread = JSON.stringify([said.length, said.at(-1)?.date, language()]);
    if ($('thread').dataset.for !== signatureOfThread) {
        $('thread').dataset.for = signatureOfThread;
        $('thread').replaceChildren(...said.map(entry => {
            const [shop, name] = whereOf(entry.fiche);
            const about = el('button', { type: 'button', className: 'about', textContent: label(shop, name) });
            about.addEventListener('click', () => { const made = fulfilled(view.fiches[entry.fiche], isMade); go(made?.shop ?? shop, made?.name ?? name); view.fresh = false; draw(); load(); note('pick', here()); });
            // The lines that only carry settings (Style: …, Character: …) are for the assistant.
            const text = entry.text.split('\n').filter(line => !/^(Name|Style|Character|Cast|Props to use|Starts when|Tone|Drawing to start from): /.test(line)).map(line => line.replace(/^At: (.+)$/, '⏱ $1')).join('\n');
            return el('li', { className: entry.author },
                el('span', { className: 'who' }, t(entry.author === 'llm' ? 'llm' : 'you'), ' · ', about, entry.decision === 'approve' ? ' · ' + t('decision.approve') : ''),
                [text, ...entry.questions.map(q => `? ${q.text}`)].filter(Boolean).join('\n'));
        }));
        $('thread').scrollTop = $('thread').scrollHeight;
    }
    // What the message will be about: what is on show, or something new.
    const nothing = !current() || !exists();
    if (nothing) view.fresh = true;
    $('about-this').hidden = nothing;
    $('about-this').textContent = current() ? t('about.this', { name: label(view.shop, current()) }) + (view.moment != null && shown()?.playing === false ? ` · ⏱ ${(view.moment / 1000).toFixed(1)} s` : '') : '';
    $('about-this').setAttribute('aria-pressed', String(!view.fresh && !view.aside));
    $('about-new').setAttribute('aria-pressed', String(!!view.fresh));
    $('about-interface').setAttribute('aria-pressed', String(!!view.aside));
    $('note').placeholder = t(view.aside ? 'interface.placeholder' : view.fresh ? `fresh.${view.shop}` : 'note.placeholder');
    $('questions').hidden = !!view.fresh;
    $('export').hidden = !!view.fresh || !current() || !exists();
    // Lean: only the assistant's last word shows; the whole conversation opens on demand.
    // The assistant's last word about what is on show, or else its last word at all.
    const onThis = fiche.entries.findLast?.(entry => entry.author === 'llm' && entry.text), onPage = view.fiches[INTERFACE]?.entries.findLast?.(entry => entry.author === 'llm' && entry.text);
    const lastWord = (onPage && (view.aside || !onThis || onPage.date > onThis.date) ? onPage : onThis) ?? said.findLast?.(entry => entry.author === 'llm');
    $('last-word').textContent = lastWord ? lastWord.text.split('\n').filter(line => !/^(Name|Style|Character|Cast): /.test(line)).join(' ') : '';
    $('last-word').hidden = !lastWord || !$('thread').hidden;
    $('history').hidden = !said.length;
    // Closed questions the LLM asked last: answered with one click.
    const last = fiche.entries.at(-1);
    const questions = last?.author === 'llm' ? last.questions : [];
    const signature = JSON.stringify([talkName(), questions]);
    if ($('questions').dataset.for !== signature) {
        $('questions').dataset.for = signature;
        // A question is answered with one click: Yes or No unless it offers other choices.
        $('questions').replaceChildren(...questions.map(question => {
            const choices = question.choices.length ? question.choices : ['yes', 'no'];
            const label = choice => ({ yes: t('yes'), oui: t('yes'), no: t('no'), non: t('no') }[choice.toLowerCase()] ?? choice);
            const row = el('div', { className: 'question' }, el('p', { textContent: question.text }));
            const group = el('span', { className: 'choices' });
            for (const choice of choices) {
                const button = el('button', { type: 'button', textContent: label(choice) });
                button.setAttribute('aria-pressed', 'false');
                button.addEventListener('click', () => {
                    const on = button.getAttribute('aria-pressed') !== 'true';
                    for (const other of group.children) other.setAttribute('aria-pressed', 'false');
                    button.setAttribute('aria-pressed', String(on));
                    row.dataset.answer = on ? choice : '';
                });
                group.append(button);
            }
            row.append(group);
            row.dataset.question = question.text;
            return row;
        }));
    }
}

// The line to write in keeps the focus: whoever dictates with a tool of their
// own (or just types) never has to click in it first. Not on a touch screen,
// where focus would raise the keyboard over the page.
const fine = matchMedia('(pointer: fine)').matches;
export const attend = () => { if (fine && !document.querySelector('dialog[open]') && !$('say').hidden) $('note').focus({ preventScroll: true }); };
addEventListener('click', event => {
    // A click on something to type in or choose from keeps its own focus.
    if (event.target.closest('input, select, textarea, [contenteditable], dialog, #advanced')) return;
    attend();
});
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close', attend);
// Typing anywhere goes to that line.
addEventListener('keydown', event => {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || event.key === ' ') return;
    if (/^(TEXTAREA|INPUT|SELECT)$/.test(document.activeElement?.tagName ?? '') || document.querySelector('dialog[open]')) return;
    attend();
});
// Enter sends; Shift+Enter makes a new line.
$('note').addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    if (something() || (view.fresh && $('note').value.trim())) $('say').requestSubmit(document.querySelector('[data-decision="redo"]'));
});
