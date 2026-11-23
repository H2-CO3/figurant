// Imported drawings: a picture sent from the page is saved in the project's
// assets/ folder, under a plain name made from its own (letters, digits and
// dashes), and only when it is an image of a known kind, 3 MB at most.

import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { send, json, bytes } from './http.js';

/** @param {string} root the project folder */
export function createAssets(root) {
    return {
        /** POST /__figurant/api/assets/<file name> */
        async add(req, res, [, assetName]) {
            if (req.method !== 'POST') return send(res, 405, 'POST an image.');
            let wanted;
            try { wanted = decodeURIComponent(assetName); } catch { return send(res, 400, 'Bad name.'); }
            const ext = extname(wanted).toLowerCase();
            const stem = wanted.slice(0, wanted.length - ext.length).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
            if (/[\\/]/.test(wanted) || !stem || !/^\.(png|jpe?g|webp|gif|svg)$/.test(ext) || !/^image\//.test(req.headers['content-type'] || '')) {
                return send(res, 400, 'An image file: png, jpg, webp, gif or svg.');
            }
            let data;
            try { data = await bytes(req, 3_000_000); } catch (error) { return send(res, error.tooLarge ? 413 : 400, 'The image is too large: 3 MB at most.'); }
            await mkdir(join(root, 'assets'), { recursive: true });
            await writeFile(join(root, 'assets', stem + ext), data);
            return json(res, 200, { path: `assets/${stem}${ext}` });
        },
    };
}
