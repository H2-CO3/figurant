import { t } from '../i18n.js';
import { themeVars, THEME_KEYS } from '../theme.js';
import { $, el, api } from './dom.js';
import { everyone, styleBook } from './project.js';
import { note } from './activity.js';
import { draw } from './draw.js';
import { load } from './stage.js';
import { thumbs, keptThumb, thumbnail } from './thumbs.js';

// Styles: each is a brief for whoever draws, and a theme for this page. One is in use.
let editing = null;
const DEFAULTS = { paper: '#ffffff', ink: '#16181d', accent: '#3b5bdb', pop: '#ffd23f' };
export const themeOf = style => ({ ...DEFAULTS, ...style?.theme });
/** The style in use colours the page, and the stage the characters are shown on. */
function applyTheme() {
    const style = styleBook.styles.find(candidate => candidate.id === styleBook.active);
    const root = document.documentElement.style;
    const vars = themeVars(style?.theme);
    for (const name of [...THEME_KEYS.map(key => `--${key}`), '--on-accent', '--on-pop']) {
        if (vars[name]) root.setProperty(name, vars[name]); else root.removeProperty(name);
    }
    // The style in use, with its colours: the button that opens the styles shows there is more than one look.
    const theme = themeOf(style);
    $('style-open').replaceChildren(
        el('span', { className: 'swatches' }, ...['paper', 'accent', 'pop', 'ink'].map(key => el('i', { style: `background:${theme[key]}` }))),
        el('span', { className: 'word', textContent: t('style.word') }),
        el('b', { textContent: style ? style.name : t('style.none') }),
        el('span', { className: 'turn', textContent: '⇄' }));
}
export const stageTheme = () => {
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
export async function loadStyles() {
    try { Object.assign(styleBook, await api('styles')); } catch { /* keep what we have */ }
    applyTheme();
}
const slug = name => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'style';
const styleCall = async (path, init, status = 'style-status') => {
    $(status).textContent = '';
    try { Object.assign(styleBook, await api(path, init)); applyTheme(); showStyles(); return true; }
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
