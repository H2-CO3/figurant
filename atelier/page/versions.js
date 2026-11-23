import { t, language } from '../i18n.js';
import { fulfilled, versionsOf } from '../orders.js';
import { $, el, api } from './dom.js';
import { view, current, ficheName, exists, isMade } from './project.js';
import { note } from './activity.js';
import { address, load } from './stage.js';
import { needles } from './export.js';

// ── Before and after: the item as it was each time the person said something
// about it, played for real from the project's history (git), to compare with
// what it is now. ────────────────────────────────────────────────────────────
export const past = { for: '', steps: [], at: null, meta: {} };
/** The config of the version on show: the present one, or the project as it was at a step back. */
export function before() {
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
    // (A block of its own beside the settings, shown with them: each scrolls by itself.)
    $('versions').hidden = gone || $('advanced').hidden;
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
