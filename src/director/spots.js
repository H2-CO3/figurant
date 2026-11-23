// The page markers. Figurant never looks at a site's own classes or ids: it
// only reads attributes that start with `data-fig-`. Restyling a site cannot
// break an animation, and searching for one prefix finds everything.
//
// readSpots() turns those attributes into plain objects and reports every
// mistake with a way to fix it, so that a person or an LLM can correct the
// page without guessing.

/** Every attribute Figurant understands, and what it accepts. */
export const ATTRIBUTES = {
    'data-fig-home': { kind: 'name', about: 'where a character is born; the value is the character name' },
    'data-fig-spot': { kind: 'name', about: 'a place a character can come to; the value names it' },
    'data-fig-at': { kind: 'fraction', fallback: 0.5, about: 'position along the element, 0 (left) to 1 (right)' },
    'data-fig-enter': { kind: 'choice', choices: ['walk', 'rope', 'drop', 'none'], fallback: 'walk', about: 'how the character arrives; none: no entrance, it is simply standing there' },
    'data-fig-scene': { kind: 'name', about: 'the scene tied to this element' },
    'data-fig-on': { kind: 'choice', choices: ['attention', 'idle', 'click', 'view'], fallback: 'attention', about: 'what starts the scene' },
    'data-fig-mood': { kind: 'choice', choices: ['free', 'solemn'], fallback: 'free', about: 'the register the content imposes' },
    'data-fig-cast': { kind: 'name', fallback: 'default', about: 'which character this concerns' },
    'data-fig-sit': { kind: 'choice', choices: ['yes', 'no'], fallback: 'yes', about: 'whether the character may sit on this edge' },
};

// Edit distance, to suggest the attribute or value someone probably meant.
function distance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const current = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
            previous = current;
        }
    }
    return row[b.length];
}

function closest(word, candidates) {
    let best = null, bestScore = Infinity;
    for (const candidate of candidates) {
        const score = distance(word, candidate);
        if (score < bestScore) { best = candidate; bestScore = score; }
    }
    return bestScore <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

/**
 * Reads every `data-fig-*` attribute under `root`.
 *
 * @param {ParentNode} root
 * @param {object} [known]
 * @param {string[]} [known.scenes] scene names that exist; unknown ones are reported
 * @param {string[]} [known.casts]  character names that exist
 * @returns {{
 *   spots: Array<{ element, name, at, enter, scene, on, mood, cast, sit }>,
 *   homes: Array<{ element, cast }>,
 *   problems: Array<{ element, attribute, value, message, fix }>
 * }}
 */
export function readSpots(root, { scenes, casts } = {}) {
    const spots = [], homes = [], problems = [];
    const names = new Map();
    const report = (element, attribute, value, message, fix) =>
        problems.push({ element, attribute, value, message, fix });

    for (const element of root.querySelectorAll('*')) {
        const own = element.getAttributeNames().filter(name => name.startsWith('data-fig-'));
        if (!own.length) continue;

        const values = {};
        for (const attribute of own) {
            if (attribute === 'data-fig-layer') continue; // set by Figurant on its own drawing
            const raw = element.getAttribute(attribute).trim();
            const rule = ATTRIBUTES[attribute];
            if (!rule) {
                const guess = closest(attribute, Object.keys(ATTRIBUTES));
                report(element, attribute, raw, `Unknown attribute "${attribute}".`,
                    guess ? `Did you mean "${guess}"?` : `Known attributes: ${Object.keys(ATTRIBUTES).join(', ')}.`);
                continue;
            }
            if (rule.kind === 'name') {
                if (!raw) { report(element, attribute, raw, `"${attribute}" needs a name.`, `Give it a value, for example ${attribute}="main".`); continue; }
                values[attribute] = raw;
            } else if (rule.kind === 'fraction') {
                const number = Number(raw);
                if (raw === '' || !Number.isFinite(number) || number < 0 || number > 1) {
                    report(element, attribute, raw, `"${attribute}" must be a number from 0 to 1, got "${raw}".`,
                        `Use a fraction of the element's width, for example ${attribute}="0.5" for the middle.`);
                    continue;
                }
                values[attribute] = number;
            } else if (rule.kind === 'choice') {
                if (!rule.choices.includes(raw)) {
                    const guess = closest(raw, rule.choices);
                    report(element, attribute, raw, `"${attribute}" cannot be "${raw}".`,
                        guess ? `Did you mean "${guess}"? Allowed: ${rule.choices.join(', ')}.` : `Allowed: ${rule.choices.join(', ')}.`);
                    continue;
                }
                values[attribute] = raw;
            }
        }

        const get = attribute => values[attribute] ?? ATTRIBUTES[attribute].fallback;
        const cast = get('data-fig-cast');
        if (casts && values['data-fig-cast'] && !casts.includes(cast)) {
            const guess = closest(cast, casts);
            report(element, 'data-fig-cast', cast, `No character is named "${cast}".`,
                guess ? `Did you mean "${guess}"?` : `Characters: ${casts.join(', ') || 'none'}.`);
        }

        if (values['data-fig-home']) {
            const name = values['data-fig-home'];
            if (casts && !casts.includes(name)) {
                const guess = closest(name, casts);
                report(element, 'data-fig-home', name, `No character is named "${name}".`,
                    guess ? `Did you mean "${guess}"?` : `Characters: ${casts.join(', ') || 'none'}.`);
            }
            homes.push({ element, cast: name });
        }

        const scene = values['data-fig-scene'];
        if (scene && scenes && !scenes.includes(scene)) {
            const guess = closest(scene, scenes);
            report(element, 'data-fig-scene', scene, `No scene is named "${scene}".`,
                guess ? `Did you mean "${guess}"?` : `Scenes: ${scenes.join(', ') || 'none'}.`);
        }

        const isSpot = values['data-fig-spot'] !== undefined || scene !== undefined;
        if (!isSpot) {
            // Options with nothing to apply to are almost always a forgotten data-fig-spot.
            const orphans = own.filter(a => ATTRIBUTES[a] && !['data-fig-home', 'data-fig-cast'].includes(a) && values[a] !== undefined);
            if (orphans.length && !values['data-fig-home']) {
                report(element, orphans[0], String(values[orphans[0]]), `"${orphans[0]}" has no effect on its own.`,
                    'Add data-fig-spot="a-name" to the same element to make it a place the character can come to.');
            }
            continue;
        }

        const name = values['data-fig-spot'] ?? scene;
        if (names.has(name)) {
            report(element, 'data-fig-spot', name, `Two places are named "${name}".`, 'Give each place its own name.');
        }
        names.set(name, element);
        if (values['data-fig-on'] && !scene) {
            report(element, 'data-fig-on', values['data-fig-on'], '"data-fig-on" says when to start a scene, but no scene is set.',
                'Add data-fig-scene="a-scene-name" to the same element, or remove data-fig-on.');
        }

        spots.push({
            element, name, cast, scene: scene ?? null,
            at: get('data-fig-at'),
            enter: get('data-fig-enter'),
            on: scene ? get('data-fig-on') : null,
            mood: get('data-fig-mood'),
            sit: get('data-fig-sit') === 'yes',
        });
    }
    return { spots, homes, problems };
}

/** One line per problem, ready to print or to hand to an LLM. */
export function describeProblems(problems, describeElement = el => `<${(el.tagName || 'element').toLowerCase()}>`) {
    return problems.map(p => `${p.scene !== undefined ? `scene "${p.scene}"` : p.composition !== undefined ? `scene "${p.composition}"` : p.character !== undefined ? `character "${p.character}"` : p.prop !== undefined ? `prop "${p.prop}"` : describeElement(p.element)} ${p.message} ${p.fix}`);
}
