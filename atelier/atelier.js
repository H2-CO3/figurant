// The atelier page. Three workshops share one layout: scenes (a scene playing
// for real on a neutral page), characters and props (one of them on a bench,
// to look at closely and pose). Each item has its fiche: an LLM cannot see
// motion or judge a drawing; the fiche turns what a person sees into
// directions written to a file.

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
};
const remember = (key, fallback) => { try { return localStorage.getItem('figurant.' + key) ?? fallback; } catch { return fallback; } };
const keep = (key, value) => { try { localStorage.setItem('figurant.' + key, value); } catch { /* private window */ } };

import { playableBy, castOf } from '/__figurant/engine/index.js';
import { t, translate, language, setLanguage } from './i18n.js';
import { themeVars, THEME_KEYS } from './theme.js';
import { filmGif } from './film.js';
import { SHEET, outline, smooth, tidy, toSvg } from './board.js';
import { fulfilled, latestPointer, animationsOf, nameFor, readable, conversation, orderName, versionsOf, talkedIn } from './orders.js';

translate();

let config;
try {
    config = (await import('/figurant.config.js')).default;
} catch (error) {
    $('problems').textContent = t('config.failed', { error: error.message });
    throw error;
}

// What each workshop holds, and the name of an item's fiche.
const SHOPS = {
    scenes: { made: Object.keys(config.scenes || {}), prefix: '' },
    characters: { made: Object.keys(config.cast || {}), prefix: 'character-' },
    emoji: { made: Object.keys(config.emoji || {}), prefix: 'emoji-' },
    props: { made: Object.keys(config.props || {}), prefix: 'prop-' },
    // A scene: several characters, each on its track in time.
    compositions: { made: Object.keys(config.compositions || {}), prefix: 'scene-' },
};
for (const shop of Object.values(SHOPS)) { shop.all = shop.made; shop.names = shop.made; shop.fiche = name => shop.prefix + name; }
// Everyone who can play a scene: the drawn characters and the emoji figures.
const everyone = { ...config.cast, ...config.emoji };
const characterName = cast => everyone[cast]?.character?.name;
/** A scene belongs to the character it was made for; one that names none plays on any body. */
const plays = (scene, cast) => playableBy(config.scenes[scene], characterName(cast));
let castNames = Object.keys(everyone);
const view = {
    shop: SHOPS[remember('shop')] ? remember('shop') : 'scenes',
    item: {}, cast: castNames.includes(remember('cast')) ? remember('cast') : castNames[0],
    width: Number(remember('width', 1440)), speed: Number(remember('speed', 1)), fiches: {}, every: remember('every') === '1',
};
for (const [shop, { names }] of Object.entries(SHOPS)) view.item[shop] = names.includes(remember('item.' + shop)) ? remember('item.' + shop) : names[0];

// What the person does here is noted for the assistant, silently: nothing on
// the page reacts to it and nobody is woken. Never what they type. See cli/activity.js.
const noted = [];
const note = (what, detail = {}) => { noted.push({ what, ...detail }); };
/** Where the person is: what they look at, and who plays it. */
const here = () => ({ shop: view.shop, item: view.item[view.shop], ...(view.shop === 'scenes' ? { cast: view.cast } : {}) });
setInterval(() => {
    if (!noted.length) return;
    fetch('/__figurant/api/activity', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: noted.splice(0) }) }).catch(() => {});
}, 1500);

const frame = $('frame');
/** The page on show: a scene's stage or the bench. Both pause, step and take a speed. */
const shown = () => frame.contentWindow?.stage || frame.contentWindow?.bench;
const current = () => view.item[view.shop];
const ficheName = () => SHOPS[view.shop].fiche(current());
/** The fiche this item is talked about in: its own, or the order it came from while it has none. */
const talkName = () => talkedIn(view.fiches, ficheName(), view.shop, current(), isMade);
/** The name shown to a person: what they called their order, a scene's title, or the file name made readable. */
const label = (shop, name) => {
    const typed = view.fiches[SHOPS[shop].fiche(name)]?.entries[0]?.text.match(/^Name: (.+)$/m)?.[1];
    const owner = shop === 'scenes' ? castOf(config.scenes?.[name])[0] : undefined;
    return readable(name, owner, typed ?? (shop === 'compositions' ? config.compositions?.[name]?.title : undefined));
};

const api = async (path, init) => {
    const response = await fetch('/__figurant/api/' + path, init);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};
const asked = fiche => {
    const last = fiche?.entries.at(-1);
    return !!last && last.author === 'person' && last.decision !== 'approve';
};

/**
 * What each workshop lists: what exists, plus what was ordered and does not
 * exist yet (a fiche with no item). Scenes are those of the chosen character.
 */
/** The style an item was drawn in, if it says so; one that says nothing belongs to every style. */
const styleOf = (shop, name) => (shop === 'compositions' ? config.compositions?.[name]?.style : shop === 'props' ? (config.props?.[name]?.style ?? config.props?.[name]?.layers?.[0]?.style) : everyone[name]?.character?.style);
const inStyle = (shop, name) => view.every || !styleBook.active || !styleOf(shop, name) || styleOf(shop, name) === styleBook.active;

function listing() {
    // Only what was made in the style in use, unless the person asks to see everything.
    for (const key of ['characters', 'emoji', 'props', 'compositions']) SHOPS[key].made = SHOPS[key].all.filter(name => inStyle(key, name));
    castNames = Object.keys(everyone).filter(name => inStyle('characters', name));
    if (!castNames.includes(view.cast)) view.cast = castNames[0];
    SHOPS.scenes.made = SHOPS.scenes.all.filter(scene => castNames.some(cast => plays(scene, cast)));
    const ordered = prefix => Object.keys(view.fiches).filter(name => (prefix ? name.startsWith(prefix) : !/^(character|prop|emoji|scene)-/.test(name))).map(name => name.slice(prefix.length));
    // What was ordered and does not exist yet; an item hidden by the style filter is not an order.
    // An order the assistant made under another name is made: it is not listed as still to make.
    for (const shop of Object.values(SHOPS)) shop.names = [...new Set([...shop.made, ...ordered(shop.prefix).filter(name => !shop.all.includes(name) && !fulfilled(view.fiches[shop.fiche(name)], made))])];
    // A character's own animations, then the common gestures (never for a body without arms).
    const room = animationsOf(Object.fromEntries(SHOPS.scenes.made.map(scene => [scene, config.scenes[scene]])), everyone[view.cast]?.character ?? { name: '' });
    const mine = [...room.own, ...room.gestures];
    view.gestures = room.gestures;
    // An order for a scene is listed under the character it names.
    const orders = SHOPS.scenes.names.filter(name => !SHOPS.scenes.all.includes(name)
        && (view.fiches[name]?.entries[0]?.text.match(/^Character: (.+)$/m)?.[1] ?? view.cast) === view.cast);
    SHOPS.scenes.names = [...mine, ...orders];
    for (const [key, shop] of Object.entries(SHOPS)) if (!shop.names.includes(view.item[key])) view.item[key] = shop.names[0];
}
const exists = () => SHOPS[view.shop].made.includes(current());
/** The workshop and the item a fiche is about, from its name ("prop-cup": props, cup). */
const whereOf = fiche => {
    for (const [shop, { prefix }] of Object.entries(SHOPS)) if (prefix && fiche.startsWith(prefix)) return [shop, fiche.slice(prefix.length)];
    return ['scenes', fiche];
};
const isMade = (shop, name) => !!SHOPS[shop]?.all.includes(name);
/** Whether the project has this item, whatever the style filter shows. */
const made = (shop, name) => !!SHOPS[shop]?.all.includes(name);
/** Takes the page to an item: its workshop, and for an animation the character that plays it. */
function go(shop, name) {
    if (!SHOPS[shop]) return;
    view.board = false;
    view.shop = shop; keep('shop', shop);
    if (shop === 'scenes' && made(shop, name)) { const owner = Object.keys(everyone).find(cast => plays(name, cast)); if (owner) { view.cast = owner; keep('cast', owner); } }
    if (name) { view.item[shop] = name; keep('item.' + shop, name); }
}

let slidersFor = null;
/** The page that plays what is on show: the present version or an earlier one (a commit), with what else it must be told. */
function address(commit, more = {}) {
    const also = { ...stageTheme(), ...(commit ? { config: `/__figurant/at/${commit}/figurant.config.js` } : {}), ...more };
    return view.shop === 'compositions' ? `show.html?${new URLSearchParams({ scene: current(), speed: view.speed, ...also })}` : view.shop === 'scenes'
        ? `stage.html?${new URLSearchParams({ scene: current(), cast: view.cast, speed: view.speed, ...also })}`
        : `bench.html?${new URLSearchParams({ kind: view.shop === 'props' ? 'prop' : 'character', name: current(), ...also })}`;
}
function load() {
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
    if (view.fresh || !current() || !exists()) { frame.src = 'about:blank'; return; }
    frame.src = address(past.at === null ? null : past.steps[past.at], view.seek ? { seek: Math.round(view.seek) } : {});
    if (!view.seek) view.moment = null;
    view.seek = 0;
    $('pause').textContent = t('pause');
}

function draw() {
    listing();
    const shop = SHOPS[view.shop];
        $('pause').textContent = t(shown()?.playing === false ? 'play' : 'pause');
    for (const button of document.querySelectorAll('[data-lang]')) button.setAttribute('aria-pressed', String(button.dataset.lang === language()));
    for (const tab of document.querySelectorAll('[data-shop]')) tab.setAttribute('aria-selected', String(!view.board && tab.dataset.shop === view.shop));
    queueMicrotask(boardDraw);
    $('items').replaceChildren(...shop.names.map(name => {
        const fiche = view.fiches[shop.fiche(name)];
        const status = fiche?.status || 'draft';
        const made = shop.made.includes(name);
        const state = !made ? 'todo' : asked(fiche) ? 'asked' : status;
        const common = view.shop === 'scenes' && view.gestures?.includes(name);
        const tag = el('span', { className: 'tag', textContent: state !== 'draft' ? t(`tag.${state}`) : common ? t('tag.gesture') : '' });
        // A picture of it, for a character or a prop; a scene keeps its dot.
        const who = [view.shop === 'props' ? 'prop' : 'character', name];
        const pictured = made && view.shop !== 'scenes' && view.shop !== 'compositions';
        // The picture drawn this time, or meanwhile the one kept from last time.
        const source = pictured ? thumbs.get(who.join(':')) || keptThumb(who.join(':')) || thumbs.get(who.join(':')) : null;
        if (pictured && !thumbs.has(who.join(':'))) thumbnail(...who);
        // Being drawn: a loader in its place. No picture to be had: its dot.
        const picture = source ? el('img', { className: 'thumb', src: source, alt: '' }) : pictured && source !== false ? el('span', { className: 'spinner thumb-wait' }) : el('span', { className: `dot ${state}` });
        const button = el('button', { type: 'button' }, picture, el('span', { className: 'name', textContent: label(view.shop, name) }), tag);
        button.title = name;
        button.setAttribute('aria-current', String(name === current()));
        button.addEventListener('click', () => { view.item[view.shop] = name; keep('item.' + view.shop, name); view.fresh = false; draw(); load(); note('pick', here()); });
        return button;
    }));
    const scenes = view.shop === 'scenes';
    $('new').setAttribute('aria-pressed', String(!!view.fresh));
    $('more').setAttribute('aria-expanded', String(!$('advanced').hidden));
    const hidden = ['characters', 'emoji', 'props'].reduce((n, key) => n + SHOPS[key].all.length, 0) - Object.keys(everyone).filter(name => inStyle('characters', name)).length - SHOPS.props.all.filter(name => inStyle('props', name)).length;
    $('every').hidden = !view.every && hidden === 0;
    $('every').textContent = t(view.every ? 'every.off' : 'every.on');
    $('cast-label').hidden = !scenes;
    $('widths').hidden = !(scenes || view.shop === 'compositions');
    timeline();
    $('elements').hidden = !scenes;
    $('bench-tools').hidden = scenes || view.shop === 'compositions';
    $('moves').hidden = $('bench-tools').hidden;
    customise();
    $('cast').replaceChildren(...castNames.map(name => el('option', { value: name, textContent: readable(name), selected: name === view.cast })));
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
    waiting();
    before();
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
    $('about-this').setAttribute('aria-pressed', String(!view.fresh));
    $('about-new').setAttribute('aria-pressed', String(!!view.fresh));
    $('note').placeholder = t(view.fresh ? `fresh.${view.shop}` : 'note.placeholder');
    $('questions').hidden = !!view.fresh;
    $('export').hidden = !!view.fresh || !current() || !exists();
    // Lean: only the assistant's last word shows; the whole conversation opens on demand.
    // The assistant's last word about what is on show, or else its last word at all.
    const lastWord = fiche.entries.findLast?.(entry => entry.author === 'llm' && entry.text) ?? said.findLast?.(entry => entry.author === 'llm');
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
    say();
    if (!$('pick-props').children.length) {
        const pick = (name, kind) => el('label', {}, el('input', { type: 'checkbox', value: name, name: kind }), ' ' + name);
        $('pick-props').replaceChildren(...SHOPS.props.made.map(name => pick(name, 'prop')));
        $('pick-cast').replaceChildren(...castNames.map(name => pick(name, 'cast')));
    }
}

// ── Customising a character: an emoji, or a picture, for a head. ──────────────
const EMOJI = [...'🙂😀😄😁😎🤓🥳😇🤠🥸😴🤔🙃😉😍🤩😭😡🥶🤯🤖👽👻💀🎃🤡👹🐶🐱🦊🐻🐼🐸🐵🦁🐷🐔🦄🌞🌚⭐🍎🍩⚽🎈💡'];
let customFor = null, custom = { face: '🙂', faces: {}, image: null };

/** Shows the panel for a character the project declares as customisable. */
async function customise() {
    const name = (view.shop === 'characters' || view.shop === 'emoji') && config.custom?.[current()] ? current() : null;
    $('customise').hidden = !name;
    if (!name || customFor === name) return;
    customFor = name;
    if (!$('emoji-grid').children.length) {
        $('emoji-grid').replaceChildren(...EMOJI.map(glyph => {
            const button = el('button', { type: 'button', textContent: glyph });
            button.addEventListener('click', () => saveCustom({ ...custom, face: glyph, faces: {}, image: null }));
            return button;
        }));
    }
    try { custom = await api(`custom/${encodeURIComponent(name)}`); } catch { /* not saved yet */ }
    showCustom();
}
function showCustom() {
    $('face').value = custom.face ?? '';
    for (const key of ['blink', 'wide', 'squint']) $(`face-${key}`).value = custom.faces?.[key] ?? '';
    $('image-name').textContent = custom.image ? t('custom.using', { name: custom.image.split('/').pop() }) : '';
    $('image-remove').hidden = !custom.image;
    for (const button of $('emoji-grid').children) button.setAttribute('aria-pressed', String(!custom.image && button.textContent === custom.face));
}
async function saveCustom(next) {
    try {
        custom = await api(`custom/${encodeURIComponent(customFor)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) });
        $('custom-status').textContent = t('custom.saved');
        showCustom();
        load(); // the bench reads the project again: the new head is on show
    } catch (error) { $('custom-status').textContent = t('custom.failed', { error: error.message }); }
}
$('face-save').addEventListener('click', () => saveCustom({
    face: $('face').value.trim(), image: null,
    faces: Object.fromEntries(['blink', 'wide', 'squint'].map(key => [key, $(`face-${key}`).value.trim()])),
}));
$('image-remove').addEventListener('click', () => saveCustom({ ...custom, image: null }));
$('image-file').addEventListener('change', async () => {
    const file = $('image-file').files[0];
    if (!file) return;
    try {
        const { path } = await api(`assets/${encodeURIComponent(file.name)}`, { method: 'POST', headers: { 'content-type': file.type || 'application/octet-stream' }, body: file });
        await saveCustom({ ...custom, image: path });
    } catch (error) { $('custom-status').textContent = t('custom.failed', { error: error.message }); }
    $('image-file').value = '';
});

/** The timeline of a scene: who does what, when. Read-only: it is changed by saying so. */
function timeline() {
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
        el('div', { className: 'track' }, el('span'), el('div', { className: 'ruler' }, ...[0, 0.25, 0.5, 0.75, 1].map(part => el('span', { textContent: `${(length * part / 1000).toFixed(1)} s` })))),
        el('div', { className: 'head' }, el('i', { id: 'playhead' })),
    );
    $('timeline').dataset.length = String(length);
}

/** The one line under the stage: what is missing, or what is wrong with what is shown. One place writes it. */
function say() {
    const shop = SHOPS[view.shop];
    const text = !shop.names.length ? t(`empty.${view.shop}`)
        : !exists() ? t(view.fiches[ficheName()]?.entries.at(-1)?.author === 'llm' ? 'ordered.made' : 'ordered.waiting', { name: label(view.shop, current()) })
        : (shown()?.problems || []).join('\n');
    if ($('problems').textContent !== text) $('problems').textContent = text;
}

/** Writes an order for something that does not exist yet, and shows it. */
async function order(name, text, shop = 'scenes') {
    const fiche = SHOPS[shop].fiche(name);
    view.fiches[fiche] = await api(`fiches/${encodeURIComponent(fiche)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'brief', note: text }),
    });
    view.shop = shop; view.item[shop] = name;
    $('saved').textContent = t('saved.ordered');
    draw(); load();
}

/** The bench's numbers as sliders, its moves as buttons. Built once per item. */
function tools() {
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

/** How many answers the LLM has written, over all fiches. */
const answers = fiches => Object.values(fiches).reduce((n, fiche) => n + fiche.entries.filter(entry => entry.author === 'llm').length, 0);
let answered = null;

async function refresh() {
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

for (const tab of document.querySelectorAll('[data-shop]')) {
    tab.addEventListener('click', () => { view.board = false; view.shop = tab.dataset.shop; keep('shop', view.shop); view.fresh = false; draw(); load(); note('open', { shop: view.shop }); note('pick', here()); });
}
$('cast').addEventListener('change', event => { view.cast = event.target.value; keep('cast', view.cast); draw(); load(); note('pick', here()); });

// The order form: a name, the elements to use, and what is wanted, in plain words.
// "+ New": the next message asks for something that does not exist yet.
const fresh = on => { view.fresh = on; draw(); load(); ready(); if (on) { $('note').focus(); note('new', { shop: view.shop }); } };
$('new').addEventListener('click', () => fresh(true));
$('about-new').addEventListener('click', () => fresh(true));
$('about-this').addEventListener('click', () => fresh(false));
// Advanced: the fine settings, in the conversation's panel, which grows to hold them.
const advanced = open => {
    $('advanced').hidden = !open; document.querySelector('.layout').classList.toggle('wide', open);
    $('more').setAttribute('aria-expanded', String(open)); keep('advanced', open ? '1' : '0');
};
$('history').addEventListener('click', () => { $('thread').hidden = !$('thread').hidden; $('history').setAttribute('aria-expanded', String(!$('thread').hidden)); draw(); $('thread').scrollTop = $('thread').scrollHeight; });
$('more').addEventListener('click', () => { advanced($('advanced').hidden); note('advanced', { value: $('advanced').hidden ? 0 : 1 }); });
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
for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => { setLanguage(button.dataset.lang); translate(); slidersFor = null; draw(); });
}

// ── Pointing at a spot: a remark is clearer with a pin than with a description. ──
const pins = [];
function clearPins() { pins.length = 0; $('pins').replaceChildren(); }
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
const pinned = () => pins;

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
function boardDraw() {
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
        customFor = null; go(config.emoji?.[name] ? 'emoji' : 'characters', name);
        draw(); load(); $('saved').textContent = t('board.walking');
    } catch (error) { $('saved').textContent = t('board.failed', { error: error.message }); }
});
async function boardOrder() {
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

// ── Thumbnails: each item drawn once, small, to be recognised at a glance. ────
const thumbs = new Map();
/** A thumbnail kept from before this page was reloaded: shown at once, while the fresh one is drawn. */
const keptThumb = key => { try { return sessionStorage.getItem('figurant.thumb.' + key); } catch { return null; } };
/** The page that draws them: it loads the project once and draws each picture still. */
let thumbPage = null;
const thumbMaker = () => thumbPage ??= new Promise(done => {
    const hidden = el('iframe', { src: 'thumbs.html', width: 420, height: 420, style: 'position:absolute;left:-9999px;top:0;border:0', title: '' });
    hidden.setAttribute('aria-hidden', 'true');
    document.body.append(hidden);
    const wait = setInterval(() => { if (hidden.contentWindow?.thumbs?.ready) { clearInterval(wait); done(hidden.contentWindow.thumbs); } }, 50);
});
async function thumbnail(kind, name) {
    const key = `${kind}:${name}`;
    if (thumbs.has(key)) return;
    thumbs.set(key, null);
    const maker = await thumbMaker();
    // One per frame, so that the page stays lively while they come.
    await new Promise(done => requestAnimationFrame(done));
    const picture = maker.draw(kind, name);
    thumbs.set(key, picture || false);
    if (picture) try { sessionStorage.setItem('figurant.thumb.' + key, picture); } catch { /* no room: it will be drawn again */ }
    clearTimeout(thumbnail.redraw);
    thumbnail.redraw = setTimeout(draw, 60);
}

/** The elements ticked under "Add elements already made", as lines for the fiche. */
const picked = () => {
    const names = kind => [...$('elements').querySelectorAll(`input[name="${kind}"]:checked`)].map(input => input.value);
    return [names('prop').length ? `Props to use: ${names('prop').join(', ')}` : '', names('cast').length ? `Characters to add: ${names('cast').join(', ')}` : ''];
};

// ── Before and after: the item as it was each time the person said something
// about it, played for real from the project's history (git), to compare with
// what it is now. ────────────────────────────────────────────────────────────
const past = { for: '', steps: [], at: null, meta: {} };
/** The config of the version on show: the present one, or the project as it was at a step back. */
function before() {
    // Every fiche that led to what is on show: its own, and the orders it came from.
    const here = current() && exists() ? Object.entries(view.fiches).filter(([name, fiche]) => name === ficheName() || (made => made?.shop === view.shop && made.name === current())(fulfilled(fiche, isMade))) : [];
    const dates = here.flatMap(([, fiche]) => versionsOf.dates(fiche)).sort();
    const key = `${view.shop}/${current()}@${dates.join()}`;
    if (past.for !== key) {
        past.for = key; past.steps = []; past.at = null;
        // Every commit that changed this item or what it uses, from the project's history.
        past.meta = {};
        if (current() && exists() && !view.fresh) api('history', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shop: view.shop, name: current(), needles: needles(view.shop, current()) }) })
            .then(answer => { if (past.for !== key) return; const kept = answer.versions.filter(version => version.commit !== answer.head || answer.dirty); past.meta = Object.fromEntries(kept.map(version => [version.commit, version])); past.steps = kept.map(version => version.commit).reverse(); before(); }).catch(() => {});
    }
    const n = past.steps.length, back = past.at !== null, gone = !!view.fresh || !n;
    // Two small stages in the corners, each playing the version a click on it goes to:
    // on the left what came before, on the right (once gone back) what comes after.
    const mini = (id, to, words) => {
        const button = $(id), show = !gone && to !== undefined;
        button.hidden = !show;
        if (!show) { button.dataset.to = ''; button.querySelector('iframe').removeAttribute('src'); return; }
        const src = address(to === null ? null : past.steps[to]);
        if (button.dataset.src !== src) { button.dataset.src = src; button.querySelector('iframe').src = src; }
        button.dataset.to = String(to);
        button.querySelector('span').textContent = words;
    };
    mini('older', back ? (past.at > 0 ? past.at - 1 : undefined) : n - 1, t(back ? 'version.older' : 'before'));
    mini('newer', back ? (past.at === n - 1 ? null : past.at + 1) : undefined, t('after'));
    $('version-name').hidden = gone || !back;
    $('version-name').textContent = back ? t('version.name', { n: past.at + 1, of: n }) : '';
    $('viewport').classList.toggle('past', !gone && back);
    // The same versions as a list, newest first: one click goes to any of them.
    $('versions').hidden = gone;
    if (gone) return;
    const said = here.flatMap(([, fiche]) => (fiche.entries ?? []).filter(entry => entry.author === 'person')).sort((a, b) => a.date < b.date ? -1 : 1);
    /** What the person had asked for when that version was made, or failing that what the commit says. */
    const words = version => {
        const asked = said.filter(entry => Date.parse(entry.date) <= Date.parse(version.date)).at(-1);
        const line = (asked?.text ?? '').split('\n').find(text => text.trim() && !/^(>|[A-Z][\w ]*: )/.test(text.trim()));
        return (line?.trim() || version.subject || '').slice(0, 70);
    };
    const when = date => new Date(date).toLocaleString(language(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const row = (at, title, sub) => {
        const button = el('button', { type: 'button' }, el('b', { textContent: title }), ...(sub ? [el('span', { textContent: sub })] : []));
        button.setAttribute('aria-current', String(past.at === at));
        button.addEventListener('click', () => { version(at); note('version', { value: at ?? -1 }); });
        return el('li', {}, button);
    };
    $('version-list').replaceChildren(row(null, t('version.now')), ...past.steps.map((commit, i) => row(i, when(past.meta[commit].date), words(past.meta[commit]))).reverse());
    $('version-restore').hidden = !back;
}
/** Goes to a step back (or to now, with null), and plays it from the start. */
const version = at => { past.at = at; before(); load(); };
for (const id of ['older', 'newer']) $(id).addEventListener('click', () => { const to = $(id).dataset.to; version(to === 'null' ? null : Number(to)); note('version', { value: past.at ?? -1 }); });

$('version-restore').addEventListener('click', async () => {
    const commit = past.steps[past.at];
    if (!commit) return;
    try {
        await api('restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shop: view.shop, name: current(), commit, needles: needles(view.shop, current()) }) });
        location.reload(); // the project has changed: it is read again
    } catch (error) { $('saved').textContent = t('version.failed', { error: error.message }); }
});

// ── Export: what is on show, made ready to leave the atelier. A folder for a
// website (its files, the engine, a page that shows it, a manual for whoever
// integrates it), and a GIF of it when it runs in time. ───────────────────────
/** The item and everything it uses, each with a piece of its source by which the server finds its file. */
function needles(shop, name) {
    const out = [], seen = new Set();
    const add = (kind, key, text, hint) => { if (text && !seen.has(kind + key)) { seen.add(kind + key); out.push({ kind, key, text: String(text).slice(0, 6000), hint }); } };
    const character = who => { const key = everyone[who] ? who : Object.keys(everyone).find(k => everyone[k].character?.name === who); const made = everyone[key]?.character; if (made) add('character', key, made.head?.create?.toString() ?? `name: '${made.name}'`, made.name); };
    const animation = key => { const made = config.scenes?.[key]; if (!made) return; add('scene', key, made.play?.toString(), castOf(made)[0]); for (const who of castOf(made)) character(who); };
    const prop = key => { const made = config.props?.[key]; if (made) add('prop', key, `name: '${made.name ?? made.layers?.[0]?.name}'`); };
    if (shop === 'compositions') {
        const scene = config.compositions?.[name];
        add('composition', name, scene?.title ? `title: '${scene.title}'` : `'${name}'`);
        for (const member of scene?.cast ?? []) character(member.character);
        for (const clip of Object.values(scene?.tracks ?? {}).flat()) if (clip.play) animation(clip.play);
        for (const item of scene?.props ?? []) prop(item.prop);
    } else if (shop === 'scenes') { animation(name); character(view.cast); }
    else if (shop === 'props') prop(name);
    else character(name);
    return out;
}
let exporting = false;
$('export').addEventListener('click', async () => {
    if (exporting || !current() || !exists()) return;
    exporting = true; $('export').disabled = true;
    const shop = view.shop, name = current(), say = words => { $('saved').textContent = words; };
    try {
        say(t('export.doing'));
        const done = await api('export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shop, name, title: label(shop, name), needles: needles(shop, name) }) });
        let film = '';
        if (shop === 'scenes' || shop === 'compositions') {
            const gif = await filmGif({ src: address(null, { speed: 1 }), onProgress: part => say(t('export.film', { n: Math.round(part * 100) })) });
            await fetch(`/__figurant/api/export/${encodeURIComponent(name)}/gif`, { method: 'POST', headers: { 'content-type': 'image/gif' }, body: gif });
            // And in the person's hands at once: a GIF is made to be sent.
            const link = el('a', { href: URL.createObjectURL(new Blob([gif], { type: 'image/gif' })), download: `${name}.gif` });
            document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 10000);
            film = ` + ${name}.gif`;
        }
        say(t('export.done', { folder: done.folder }) + film);
        note('export', { shop, item: name });
    } catch (error) { say(t('export.failed', { error: error.message })); }
    exporting = false; $('export').disabled = false;
});

/** Something to send: an answer, a word, or a pin. */
const something = () => !!($('note').value.trim() || pins.length || $('questions').querySelector('[aria-pressed="true"]') || $('elements').querySelector('input:checked'));
const ready = () => { document.querySelector('[data-decision="redo"]').disabled = !something(); };
$('say').addEventListener('input', ready);
$('say').addEventListener('click', () => setTimeout(ready));
$('pins').addEventListener('click', () => setTimeout(ready));

$('say').addEventListener('submit', async event => {
    event.preventDefault();
    let decision = event.submitter?.dataset.decision || 'note';
    // On the whiteboard, the message says what the drawing is: an order for a character, with the drawing.
    if (view.board) { await boardOrder(); return; }
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

// ── The timeline. Where the playhead is, and going to a moment: a click or a
// drag on it holds the picture there and opens the panel, so that what is said
// or changed next is about that moment. ──────────────────────────────────────
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

setInterval(() => {
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
}, 200);
// Is an assistant listening for what is written here? The person should know before they write.
let assistant = { listening: false, working: false };
async function listening() {
    try { assistant = await api('listening'); } catch { /* the server is restarting */ }
    const state = assistant.working ? 'working' : assistant.listening ? 'on' : 'off';
    $('listening').replaceChildren(el('span', { className: `dot ${state === 'off' ? '' : state}` }), t(`listening.${state}`));
    $('listening').title = state === 'off' ? t('listening.off.title') : t('listening.on.title');
    follow();
    waiting();
}
/**
 * The assistant drives the screen while it works: it says which workshop and
 * item it is on, and the page goes there, so the person sees what it is doing.
 */
let followed = remember('screen', '');
function follow() {
    const screen = assistant.screen;
    if (!screen?.see || screen.at === followed) return;
    followed = screen.at; keep('screen', followed);
    const [shop, name] = screen.see.split('/');
    if (!SHOPS[shop]) return;
    go(shop, name);
    draw(); load();
}

/** While a message waits for its answer, the form steps aside: one message at a time, and a sign that work is under way. */
function waiting() {
    const pending = asked(view.fiches[talkName()]);
    const someone = assistant.working || assistant.listening;
    $('working').hidden = !pending;
    $('working').classList.toggle('idle', !someone);
    $('working-text').textContent = t(someone ? 'working.on' : 'working.nobody');
    $('say').hidden = pending && someone;
    // Nobody can miss it: a bar across the top, and the stage covered with what is going on.
    const busy = assistant.working || (pending && someone);
    $('progress').hidden = !busy;
    $('busy').hidden = !busy;
    $('busy-title').textContent = t('busy.title');
    $('busy-say').textContent = assistant.screen?.say ?? '';
}
setInterval(listening, 4000);
listening();

// Styles: each is a brief for whoever draws, and a theme for this page. One is in use.
let styleBook = { active: null, styles: [] }, editing = null;
const DEFAULTS = { paper: '#ffffff', ink: '#16181d', accent: '#3b5bdb', pop: '#ffd23f' };
const themeOf = style => ({ ...DEFAULTS, ...style?.theme });
/** The style in use colours the page, and the stage the characters are shown on. */
function applyTheme() {
    const style = styleBook.styles.find(candidate => candidate.id === styleBook.active);
    const root = document.documentElement.style;
    const vars = themeVars(style?.theme);
    for (const name of [...THEME_KEYS.map(key => `--${key}`), '--on-accent', '--on-pop']) {
        if (vars[name]) root.setProperty(name, vars[name]); else root.removeProperty(name);
    }
    $('style-open').textContent = style ? t('style.label', { name: style.name }) : t('style.open');
}
const stageTheme = () => {
    const style = styleBook.styles.find(candidate => candidate.id === styleBook.active);
    return style?.theme ? Object.fromEntries(Object.entries(style.theme).filter(([, colour]) => colour)) : {};
};
/** The picker: one card per style. A click works in that style at once; the pencil opens its form. */
function showStyles() {
    $('style-list').replaceChildren(...styleBook.styles.map(style => {
        const theme = themeOf(style), used = style.id === styleBook.active;
        // Who stands for the style: one of its own characters, drawn on its own paper.
        const mascot = Object.keys(everyone).find(name => everyone[name]?.character?.style === style.id);
        const face = mascot && (thumbs.get(`character:${mascot}`) || keptThumb(`character:${mascot}`));
        if (mascot && !thumbs.has(`character:${mascot}`)) thumbnail('character', mascot).then(() => { if ($('style').open) showStyles(); });
        const pick = el('button', { type: 'button', className: 'pick' },
            el('span', { className: 'sample', style: `background:${theme.paper};color:${theme.ink}` },
                face ? el('img', { src: face, alt: '' }) : mascot ? el('span', { className: 'spinner' }) : el('b', { textContent: 'Aa' }),
                el('span', { className: 'swatches' }, el('i', { style: `background:${theme.accent}` }), el('i', { style: `background:${theme.pop}` }), el('i', { style: `background:${theme.ink}` })),
                ...(used ? [el('span', { className: 'used', textContent: t('style.used') })] : [])),
            el('span', { className: 'name', textContent: style.name }));
        pick.setAttribute('role', 'radio');
        pick.setAttribute('aria-checked', String(used));
        pick.addEventListener('click', async () => { if (!used && await styleCall(`styles/${style.id}/use`, { method: 'POST' })) { draw(); load(); note('style', { value: style.id }); } });
        const edit = el('button', { type: 'button', className: 'quiet edit', textContent: t('style.edit') });
        edit.setAttribute('aria-label', `${t('style.edit')} ${style.name}`);
        edit.addEventListener('click', () => openStyleForm(style.id));
        return el('div', { className: 'card' }, pick, edit);
    }), (() => {
        const add = el('button', { type: 'button', className: 'add', textContent: t('style.new') });
        add.addEventListener('click', () => openStyleForm(null));
        return add;
    })());
}
/** What the three colours being chosen look like together. */
function sampleStyle() {
    const sample = $('style-sample');
    sample.style.background = $('style-paper').value; sample.style.color = $('style-ink').value;
    sample.querySelector('i').style.background = $('style-accent').value;
    sample.querySelector('u').style.background = $('style-pop').value;
}
/** The form, apart: one style's name, colours and description; or a new one. */
function openStyleForm(id) {
    editing = id;
    const style = styleBook.styles.find(candidate => candidate.id === id);
    const theme = themeOf(style);
    $('style-edit-title').textContent = t(style ? 'style.edit.title' : 'style.new.title');
    $('style-name').value = style?.name ?? t('style.untitled');
    $('style-text').value = style?.prompt ?? '';
    for (const key of THEME_KEYS) $(`style-${key}`).value = theme[key];
    sampleStyle();
    $('style-edit-status').textContent = style && style.id === styleBook.active ? t('style.inuse') : '';
    // The style in use cannot be deleted; a new one has nothing to delete.
    $('style-delete').hidden = !style || style.id === styleBook.active;
    $('style-delete').textContent = t('style.delete'); delete $('style-delete').dataset.sure;
    $('style-edit').showModal();
    if (!style) $('style-name').select();
}
async function loadStyles() {
    try { styleBook = await api('styles'); } catch { /* keep what we have */ }
    applyTheme();
}
const slug = name => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'style';
const styleCall = async (path, init, status = 'style-status') => {
    $(status).textContent = '';
    try { styleBook = await api(path, init); applyTheme(); showStyles(); return true; }
    catch (error) { $(status).textContent = error.message; return false; }
};
$('style-open').addEventListener('click', async () => {
    await loadStyles();
    showStyles();
    $('style-status').textContent = '';
    $('style').showModal();
});
$('style-cancel').addEventListener('click', () => $('style').close());
$('style-back').addEventListener('click', () => $('style-edit').close());
for (const key of THEME_KEYS) $(`style-${key}`).addEventListener('input', sampleStyle);
$('style-form').addEventListener('submit', async event => {
    event.preventDefault();
    let id = editing;
    if (!id) { id = slug($('style-name').value); for (let n = 2; styleBook.styles.some(style => style.id === id); n++) id = `${slug($('style-name').value)}-${n}`; }
    const theme = Object.fromEntries(THEME_KEYS.map(key => [key, $(`style-${key}`).value]));
    if (await styleCall(`styles/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: $('style-name').value, prompt: $('style-text').value, theme }) }, 'style-edit-status')) {
        $('style-edit').close();
        $('style-status').textContent = t('style.saved');
        if (id === styleBook.active) load();
    }
});
// Deleting cannot be undone: the button asks once more before it does.
$('style-delete').addEventListener('click', async () => {
    const button = $('style-delete');
    if (!button.dataset.sure) { button.dataset.sure = '1'; button.textContent = t('style.delete.sure'); return; }
    if (await styleCall(`styles/${editing}`, { method: 'DELETE' }, 'style-edit-status')) { editing = null; $('style-edit').close(); $('style-status').textContent = t('style.deleted'); }
});
loadStyles().then(() => { draw(); load(); });
$('every').addEventListener('click', () => { view.every = !view.every; keep('every', view.every ? '1' : '0'); draw(); load(); });
// The line to write in keeps the focus: whoever dictates with a tool of their
// own (or just types) never has to click in it first. Not on a touch screen,
// where focus would raise the keyboard over the page.
const fine = matchMedia('(pointer: fine)').matches;
const attend = () => { if (fine && !document.querySelector('dialog[open]') && !$('say').hidden) $('note').focus({ preventScroll: true }); };
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

// Space plays and pauses, as in any player, unless the person is writing.
addEventListener('keydown', event => {
    if (event.code !== 'Space' || /^(TEXTAREA|INPUT|SELECT|BUTTON|SUMMARY)$/.test(document.activeElement?.tagName ?? '') || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    $('pause').click();
});

// The LLM answers in the files: pick its answers up without a reload.
setInterval(refresh, 3000);

await refresh();
// An answer may have made something under another name than the one ordered,
// or beside what was asked about: go to the latest one, once, so that the
// person sees the result and not an empty stage.
const pointer = latestPointer(view.fiches, made);
if (pointer && remember('followed') !== pointer.key) {
    keep('followed', pointer.key);
    go(pointer.shop, pointer.name);
    draw();
}
if (remember('advanced') === '1') { $('advanced').hidden = false; document.querySelector('.layout').classList.add('wide'); }
// The conversation grows and shrinks with what is in it: the page keeps room to scroll clear of it.
load();
attend();
note('open', { shop: view.shop }); note('pick', here());
ready();
listening();
if (remember('reloaded') === '1') { keep('reloaded', '0'); $('saved').textContent = t('reloaded'); }
