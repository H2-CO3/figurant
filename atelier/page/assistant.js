// The assistant at the other end: whether one is listening, what it is working
// on, and the page following it to what it shows.

import { t } from '../i18n.js';
import { $, el, remember, keep, api } from './dom.js';
import { SHOPS, view, talkName, asked, go } from './project.js';
import { draw } from './draw.js';
import { load } from './stage.js';

let assistant = { listening: false, working: false };
export async function listening() {
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
export function waiting() {
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
