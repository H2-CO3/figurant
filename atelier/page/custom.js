import { t } from '../i18n.js';
import { $, el, api } from './dom.js';
import { config, view, current } from './project.js';
import { load } from './stage.js';

// ── Customising a character: an emoji, or a picture, for a head. ──────────────
const EMOJI = [...'🙂😀😄😁😎🤓🥳😇🤠🥸😴🤔🙃😉😍🤩😭😡🥶🤯🤖👽👻💀🎃🤡👹🐶🐱🦊🐻🐼🐸🐵🦁🐷🐔🦄🌞🌚⭐🍎🍩⚽🎈💡'];
let customFor = null, custom = { face: '🙂', faces: {}, image: null };

/** Shows the panel for a character the project declares as customisable. */
export async function customise() {
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
/** The panel reads the character again the next time it is shown (its head was changed elsewhere). */
export const forgetCustom = () => { customFor = null; };
