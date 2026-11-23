// Replacing a folder with a fresh copy of the engine deletes what was there.
// That is only ever done to a folder that is missing, empty, or already a copy
// of the engine: a mistyped destination must not cost anyone their work.

import { readdir, access } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MARKS = ['index.js', join('director', 'composition.js')];
const refusal = folder => `${folder} holds files and is not a copy of the engine: nothing was deleted. Give an empty folder, or remove it yourself.`;

/** Throws unless `folder` may be replaced by a copy of the engine. */
export async function replaceable(folder) {
    const names = await readdir(folder).catch(() => []);
    if (!names.length) return;
    for (const mark of MARKS) await access(join(folder, mark)).catch(() => { throw new Error(refusal(folder)); });
}

export function replaceableSync(folder) {
    let names = [];
    try { names = readdirSync(folder); } catch { /* not there */ }
    if (names.length && !MARKS.every(mark => existsSync(join(folder, mark)))) throw new Error(refusal(folder));
}
