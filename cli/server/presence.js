// Who is there, on each side: whether an assistant is listening or at work
// (and where it says it is), read from the marks it leaves in the fiches
// folder; and what the person does on the page, noted for the assistant.

import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pending } from '../fiche.js';
import { noteActivity } from '../activity.js';
import { send, json, readJson } from './http.js';

/** @param {ReturnType<import('./fiches.js').createFiches>} fiches */
export function createPresence(fiches) {
    return {
        /** GET /__figurant/api/listening */
        async listening(req, res) {
            // An assistant waiting on the fiches (figurant fiches --wait) leaves a fresh mark there.
            const age = name => stat(join(fiches.dir, name)).then(s => Date.now() - s.mtimeMs, () => Infinity);
            // At work: one that was waiting has been woken (it left a mark), and a fiche still waits for its answer…
            const names = await fiches.names();
            const waiting = (await Promise.all(names.map(fiches.read))).some(fiche => pending(fiche));
            // … or it has just said where it is (figurant show), within the last ten minutes, and has not answered since:
            // once a fiche has been written after that and nothing waits, the work it spoke of is done.
            const shown = await age('.screen'), written = Math.min(Infinity, ...await Promise.all(names.map(name => age(`${name}.md`))));
            const showing = shown < 10 * 60_000 && (waiting || written > shown);
            const working = await age('.working') < 30 * 60_000 && (waiting || showing);
            // Where the assistant says it is, and what it is doing.
            let screen = null;
            if (showing) try {
                const said = JSON.parse(await readFile(join(fiches.dir, '.screen'), 'utf8'));
                if (/^(scenes|characters|emoji|props|compositions)(\/[a-z0-9][a-z0-9_-]{0,63})?$/i.test(said.see ?? '')) screen = { see: said.see, say: String(said.say ?? '').slice(0, 140), at: String(said.at ?? '') };
            } catch { /* it said nothing */ }
            return json(res, 200, { listening: await age('.listening') < 6000, working, ...(screen ? { screen } : {}) });
        },

        /** POST /__figurant/api/activity */
        async activity(req, res) {
            // What the person does on the page, noted silently for the assistant (see ../activity.js).
            if (req.method !== 'POST') return send(res, 405, 'POST.');
            let said;
            try { said = await readJson(req); } catch { return send(res, 400, 'Send JSON: { events: [...] }.'); }
            return json(res, 200, { noted: await noteActivity(fiches.dir, said?.events) });
        },
    };
}
