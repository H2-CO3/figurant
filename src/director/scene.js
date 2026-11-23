// The scene format. A scene is a plain object: a few fields of data that say
// where it may play, and one function, `play`, that says what happens.
//
//   {
//     room: { left, right, up },   // free space it needs, in character units
//     variants: [{ name, room }],  // smaller versions, tried in order
//     mood: 'free',                // 'solemn' or 'any' to play on solemn places
//     character: 'teapot',         // who it was made for; omit: any body
//     data: { ... },               // anything the scene wants to keep for itself
//     async play(c, ctx) { ... },  // the sequence; see docs/SCENES.md
//   }
//
// The format is versioned. Adding a field or a member to `c` does not change
// the version; removing or renaming one does.

/** Version of the scene format this engine plays. */
export const SCENE_FORMAT = 1;

/** Every field a scene may have. Anything else is reported as a mistake. */
export const SCENE_FIELDS = {
    play: 'the sequence: an async function (c, ctx)',
    room: 'free space needed around the character: { left, right, up }, in character units',
    variants: 'smaller versions tried when the full scene does not fit: [{ name, room, ... }]',
    mood: 'where it may play: "free" (default), "solemn", or "any"',
    character: 'the character it was made for: a name, or a list of names; omit it for a scene any body can play',
    data: 'free-form: whatever the scene keeps for itself',
};

const MOODS = ['free', 'solemn', 'any'];
const SIDES = ['left', 'right', 'up'];

// Edit distance, to suggest the field someone probably meant.
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
const meant = (word, candidates) => {
    const best = candidates.map(c => [distance(word, c), c]).sort((a, b) => a[0] - b[0])[0];
    return best && best[0] <= Math.max(2, Math.floor(word.length / 3)) ? best[1] : null;
};
const list = words => words.map(w => `"${w}"`).join(', ');

/**
 * Checks one scene.
 * @returns {Array<{ scene, field, value, message, fix }>} empty when it is well formed
 */
export function checkScene(name, scene) {
    const problems = [];
    const report = (field, value, message, fix) => problems.push({ scene: name, field, value, message, fix });

    if (!scene || typeof scene !== 'object') {
        report('', scene, 'is not an object.', 'A scene is { play(c, ctx) { ... } }, with optional room, variants, mood and data.');
        return problems;
    }

    const fields = (object, at, allowed) => {
        for (const key of Object.keys(object)) {
            if (allowed.includes(key)) continue;
            const guess = meant(key, allowed);
            report(at + key, object[key], `has an unknown field "${key}".`,
                guess ? `Did you mean "${guess}"?` : `Known fields: ${list(allowed)}. Put a scene's own values under "data".`);
        }
    };
    const room = (value, at) => {
        if (value === undefined) return;
        if (!value || typeof value !== 'object') {
            report(at, value, 'has a room that is not an object.', 'Write room: { left, right, up }, in character units.');
            return;
        }
        for (const [side, amount] of Object.entries(value)) {
            if (!SIDES.includes(side)) {
                const guess = meant(side, SIDES);
                report(`${at}.${side}`, amount, `has an unknown room side "${side}".`, guess ? `Did you mean "${guess}"?` : `A room has ${list(SIDES)}.`);
            } else if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
                report(`${at}.${side}`, amount, `has a room "${side}" that is not a positive number.`, 'Give the free space needed on that side, in character units (0 or more).');
            }
        }
    };
    const mood = (value, at) => {
        if (value !== undefined && !MOODS.includes(value)) {
            report(at, value, `has an unknown mood "${value}".`, `Use one of: free, solemn, any.`);
        }
    };

    const top = Object.keys(SCENE_FIELDS);
    fields(scene, '', top);
    if (typeof scene.play !== 'function') {
        report('play', scene.play, 'has no play function.', 'Add async play(c, ctx) { ... }: it is what the character does.');
    }
    room(scene.room, 'room');
    mood(scene.mood, 'mood');
    if (scene.character !== undefined && !castOf(scene).length) {
        report('character', scene.character, 'has a character that is not a name.', 'Write character: "teapot", or a list of names; omit it for a scene any body can play.');
    }

    if (scene.variants !== undefined && !Array.isArray(scene.variants)) {
        report('variants', scene.variants, 'has variants that are not a list.', 'Write variants: [{ name: "compact", room: { ... } }].');
    } else if (scene.variants) {
        const names = new Set();
        scene.variants.forEach((variant, i) => {
            const at = `variants[${i}]`;
            if (!variant || typeof variant !== 'object') {
                report(at, variant, 'has a variant that is not an object.', 'A variant is { name, room, ... }.');
                return;
            }
            fields(variant, at + '.', ['name', ...top]);
            if (typeof variant.name !== 'string' || !variant.name) {
                report(`${at}.name`, variant.name, 'has a variant with no name.', 'Give each variant a name: it is handed to play as ctx.variant.');
            } else if (names.has(variant.name) || variant.name === 'full') {
                report(`${at}.name`, variant.name, `has two versions named "${variant.name}".`, 'Give each variant its own name ("full" is the scene itself).');
            }
            names.add(variant.name);
            room(variant.room, `${at}.room`);
            mood(variant.mood, `${at}.mood`);
        });
    }
    return problems;
}

/** The characters a scene was made for; empty when it says none (or says it badly). */
export function castOf(scene) {
    const names = Array.isArray(scene?.character) ? scene.character : [scene?.character];
    return names.every(name => typeof name === 'string' && name) ? names : [];
}

/** Whether a character may play a scene: one made for it, or for any body. */
export const playableBy = (scene, characterName) => scene?.character === undefined || castOf(scene).includes(characterName);

/** Checks every scene of a { name: scene } map. */
export const checkScenes = scenes => Object.entries(scenes).flatMap(([name, scene]) => checkScene(name, scene));
