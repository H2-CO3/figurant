// The project's past, from git when it is under git: what it was at a given
// moment, its files as they were then, the versions of one item, and going
// back to one. Only full commit names are ever handed to git, and never
// through a shell.

import { execFile } from 'node:child_process';
import { sep, relative } from 'node:path';
import { locate } from '../export.js';
import { inside, hidden } from './guard.js';
import { send, json, readJson, typeOf } from './http.js';

const COMMIT = /^[0-9a-f]{40}$/;

/** @param {string} root the project folder */
export function createHistory(root) {
    /** What a git command prints, or null when it fails. */
    const git = args => new Promise(done => execFile('git', args, { cwd: root, maxBuffer: 20_000_000, encoding: 'buffer', timeout: 20_000 }, (error, out) => done(error ? null : out)));

    /** A file of the project as it was at a commit, or null. */
    const fileAt = async (commit, path) => {
        const target = inside(root, path);
        if (!COMMIT.test(commit) || !target || target === root || hidden(relative(root, target))) return null;
        // git names files from the top of its repository, which may be above the project.
        const prefix = (await git(['rev-parse', '--show-prefix']))?.toString().trim() ?? '';
        return git(['show', `${commit}:${prefix}${relative(root, target).split(sep).join('/')}`]);
    };

    // The versions of one item: the commits that changed its files (or those of what it uses),
    // newest first; and going back to one, which is a new commit: nothing is ever lost.
    const versionsOrRestore = back => async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, 'POST.');
        let asked;
        try { asked = await readJson(req, 2_000_000); } catch { return send(res, 400, 'Send JSON: { shop, name, needles }.'); }
        const { found } = await locate(root, Array.isArray(asked?.needles) ? asked.needles : []);
        const files = [...new Set(found.map(item => item.file))];
        const head = (await git(['rev-parse', 'HEAD']))?.toString().trim() ?? '';
        if (!files.length || !COMMIT.test(head)) return json(res, 200, { head: null, dirty: false, versions: [] });
        const changed = async list => ((await git(['status', '--porcelain', '--', ...list]))?.toString().trim() ?? '') !== '';
        const log = async list => ((await git(['log', '-n', '40', '--format=%H%x09%cI%x09%s', '--', ...list]))?.toString() ?? '').split('\n').filter(Boolean)
            .map(line => { const [commit, date, ...subject] = line.split('\t'); return { commit, date, subject: subject.join('\t').slice(0, 200) }; }).filter(version => COMMIT.test(version.commit));
        const kind = { scenes: 'scene', compositions: 'composition', props: 'prop' }[asked?.shop] ?? 'character';
        const own = found.find(item => item.kind === kind && item.key === String(asked?.name))?.file;
        if (!back) {
            // What it uses is older than it is: versions from before its own file existed are not versions of it.
            const born = own ? (await git(['log', '--diff-filter=A', '--format=%cI', '--', own]))?.toString().trim().split('\n').at(-1) : '';
            const versions = (await log(files)).filter(version => !born || Date.parse(version.date) >= Date.parse(born));
            return json(res, 200, { head, dirty: await changed(files), versions });
        }
        // Going back: only the item's own file, only to a version of it, and never over work that is not saved in git.
        if (!own) return send(res, 404, 'That item was not found in the project\'s files.');
        const to = (await log([own])).find(version => version.commit === asked?.commit);
        if (!to) return send(res, 404, 'That is not a version of this item.');
        if (await changed([own])) return send(res, 409, `${own} has changes that are not saved in git: save or discard them first.`);
        if (!await git(['checkout', to.commit, '--', own])) return send(res, 500, 'git could not bring that version back.');
        if (!await changed([own])) return json(res, 200, { file: own, unchanged: true });
        if (!await git(['commit', '-m', `Back to the version of ${to.date}: ${String(asked.name).replace(/[^\w-]/g, '')}`, '--', own])) {
            // Not saved: the file goes back to what it was, so that nothing is left half done.
            await git(['checkout', 'HEAD', '--', own]);
            return send(res, 500, 'git could not save the return (is an author set? git config user.name). Nothing was changed.');
        }
        return json(res, 200, { file: own, from: to.commit });
    };

    return {
        /** POST /__figurant/api/history */
        versions: versionsOrRestore(false),

        /** POST /__figurant/api/restore */
        restore: versionsOrRestore(true),

        /** GET /__figurant/at/<commit>/<path>: a file as it was then. */
        async at(req, res, [, commit, path]) {
            const body = await fileAt(commit, path);
            return body ? send(res, 200, body, typeOf(path)) : send(res, 404, 'Not in that version.');
        },
    };
}
