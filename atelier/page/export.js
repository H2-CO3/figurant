import { castOf } from '/__figurant/engine/index.js';
import { t } from '../i18n.js';
import { filmGif } from '../film.js';
import { $, el, api } from './dom.js';
import { config, everyone, view, current, label, exists } from './project.js';
import { note } from './activity.js';
import { address } from './stage.js';

// ── Export: what is on show, made ready to leave the atelier. A folder for a
// website (its files, the engine, a page that shows it, a manual for whoever
// integrates it), and a GIF of it when it runs in time. ───────────────────────
/** The item and everything it uses, each with a piece of its source by which the server finds its file. */
export function needles(shop, name) {
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
        const done = await api('export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shop, name, title: label(shop, name), needles: needles(shop, name), sounds: shop === 'compositions' ? (config.compositions?.[name]?.sounds ?? []).map(cue => cue.src) : [] }) });
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
