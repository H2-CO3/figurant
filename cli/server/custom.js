// Customisations: the face or picture a person chooses for a character, from
// the page. Each is a module the project imports, so that it travels with the
// character; it is written from checked values only, never from text.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join, sep, dirname, relative } from 'node:path';
import { inside } from './guard.js';
import { send, json, readJson } from './http.js';

const IMAGE = /^assets\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|gif|svg)$/;
const glyph = value => typeof value === 'string' && value.length >= 1 && value.length <= 16 && !/[\x00-\x7f]/.test(value);

/**
 * @param {string} root   the project folder
 * @param {object} custom { character: 'path/to/name.custom.js' }, from figurant.config.js
 */
export function createCustom(root, custom) {
    /** The module a character's customisation is saved in, or null when it is not declared. */
    const customFile = name => {
        if (!Object.hasOwn(custom, name) || typeof custom[name] !== 'string' || !custom[name].endsWith('.custom.js')) return null;
        return inside(root, custom[name]);
    };
    /** The checked customisation, or what is wrong with what was sent. */
    async function check(value) {
        if (!value || typeof value !== 'object') return 'Send { face, faces?, image? }.';
        if (value.face !== undefined && !glyph(value.face)) return 'face is one emoji.';
        const faces = {};
        for (const key of ['blink', 'wide', 'squint']) {
            const face = value.faces?.[key];
            if (face === undefined || face === '' || face === null) continue;
            if (!glyph(face)) return `faces.${key} is one emoji.`;
            faces[key] = face;
        }
        let image = null;
        if (value.image) {
            if (typeof value.image !== 'string' || !IMAGE.test(value.image)) return 'image is a file imported into assets/.';
            if (!await access(join(root, value.image)).then(() => true, () => false)) return 'That image is not in assets/.';
            image = value.image;
        }
        if (!value.face && !image) return 'Give a face or an image.';
        return { face: value.face ?? '🙂', faces, image };
    }
    const moduleText = (file, value) => {
        let address = value.image && relative(dirname(file), join(root, value.image)).split(sep).join('/');
        if (address && !address.startsWith('.')) address = './' + address;
        return `// Written by the atelier: the customisation chosen for this character.\n// Change it from the atelier's page rather than by hand.\nexport default {\n    face: ${JSON.stringify(value.face)},\n    faces: ${JSON.stringify(value.faces)},\n    image: ${address ? `new URL(${JSON.stringify(address)}, import.meta.url).href` : 'null'},\n};\n`;
    };
    const read = async file => {
        try {
            const text = await readFile(file, 'utf8');
            const pick = key => { const found = new RegExp(`${key}: ("(?:[^"\\\\]|\\\\.)*"|\\{[^}]*\\})`).exec(text); return found ? JSON.parse(found[1]) : undefined; };
            const address = /image: new URL\(("(?:[^"\\]|\\.)*")/.exec(text);
            return { face: pick('face') ?? '🙂', faces: pick('faces') ?? {}, image: address ? relative(root, resolve(dirname(file), JSON.parse(address[1]))).split(sep).join('/') : null };
        } catch { return { face: '🙂', faces: {}, image: null }; }
    };

    return {
        /** GET or PUT /__figurant/api/custom/<character> */
        async one(req, res, [, name]) {
            const target = customFile(decodeURIComponent(name));
            if (!target) return send(res, 404, 'This character is not declared as customisable (custom: { name: "path/name.custom.js" } in figurant.config.js).');
            if (req.method === 'GET') return json(res, 200, await read(target));
            if (req.method !== 'PUT') return send(res, 405, 'GET or PUT.');
            let value;
            try { value = await readJson(req); } catch { return send(res, 400, 'Send JSON: { face, faces, image }.'); }
            const checked = await check(value);
            if (typeof checked === 'string') return send(res, 400, checked);
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, moduleText(target, checked));
            return json(res, 200, checked);
        },
    };
}
