// What an order became. A person orders something under a name of their own
// ("salto"); the assistant may make it under another ("backflip-tabby") and
// says so in its answer (`=> scenes/backflip-tabby`). Pure functions, so that
// they are tested without a browser.

const target = (entry, exists) => {
    if (entry?.author !== 'llm' || !entry.see) return null;
    const [shop, name] = entry.see.split('/');
    return name && exists(shop, name) ? { shop, name } : null;
};

/**
 * Where the thing ordered in this fiche is, once made, or null while it is
 * still to make.
 * @param {{ entries: object[] } | undefined} fiche
 * @param {(shop: string, name: string) => boolean} exists
 */
export function fulfilled(fiche, exists) {
    for (const entry of [...(fiche?.entries ?? [])].reverse()) {
        const made = target(entry, exists);
        if (made) return made;
    }
    return null;
}

/**
 * The fiche in which an item is talked about: its own once it has one, or
 * else the order it came from (an item just made has no fiche yet: the
 * assistant's questions about it are in the order's, and so go the answers).
 * @param {Record<string, { entries: object[] }>} fiches
 * @param {string} own the item's own fiche name
 */
export function talkedIn(fiches, own, shop, name, exists) {
    if (fiches[own]?.entries?.length) return own;
    const orders = Object.entries(fiches).filter(([, fiche]) => { const made = fulfilled(fiche, exists); return made?.shop === shop && made.name === name; });
    orders.sort(([, a], [, b]) => (a.entries.at(-1)?.date ?? '') < (b.entries.at(-1)?.date ?? '') ? -1 : 1);
    return orders.at(-1)?.[0] ?? own;
}

/**
 * The most recent answer, over all fiches, that points at something that
 * exists: where to take the person after the assistant has worked.
 * @returns {{ key: string, shop: string, name: string } | null} `key` names the answer, to go there once only
 */
export function latestPointer(fiches, exists) {
    let best = null;
    for (const [fiche, { entries = [] }] of Object.entries(fiches)) {
        for (const entry of entries) {
            const made = target(entry, exists);
            if (made && (!best || String(entry.date) > best.date)) best = { date: String(entry.date), key: `${fiche}@${entry.date}`, ...made };
        }
    }
    return best && { key: best.key, shop: best.shop, name: best.name };
}

/**
 * What the animation room shows for a character: the animations made for it,
 * the common gestures (those that name nobody; they need arms), and the
 * animations of others, which can be adapted.
 * @param {Record<string, { character?: string | string[] }>} scenes
 * @param {{ name: string, arms?: string }} character
 */
export function animationsOf(scenes, character) {
    const out = { own: [], gestures: [], others: [] };
    for (const [name, scene] of Object.entries(scenes)) {
        if (scene.character === undefined) { if (character.arms !== 'none') out.gestures.push(name); }
        else out[[].concat(scene.character).includes(character.name) ? 'own' : 'others'].push(name);
    }
    return out;
}

/**
 * The file name for what a person called their order, in their own words:
 * lower case, accents dropped, spaces and anything else that is not a letter,
 * a digit or "_" turned into "-". Empty when nothing usable is left. What they
 * typed is kept beside it, as the name shown.
 */
export function nameFor(typed) {
    return String(typed).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9_]+/g, '-').replace(/^[-_]+/, '').slice(0, 60).replace(/[-_]+$/, '');
}

/**
 * A name to show to a person: what they typed if they named it, or the file
 * name made readable ("backflip-tabby", for tabby: "Backflip").
 */
export function readable(name, owner, typed) {
    if (typed) return typed;
    let words = String(name);
    if (owner && words.endsWith('-' + owner) && words.length > owner.length + 1) words = words.slice(0, -owner.length - 1);
    words = words.replace(/[-_]+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The one conversation of a project: every entry of every fiche, in order of
 * time, each knowing which fiche it was said in.
 * @param {Record<string, { entries: object[] }>} fiches
 * @param {number} [latest] keep only that many, the most recent
 */
export function conversation(fiches, latest = Infinity) {
    const all = Object.entries(fiches).flatMap(([fiche, { entries = [] }]) => entries.map(entry => ({ ...entry, fiche })));
    all.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return latest === Infinity ? all : all.slice(-latest);
}

/** A file name for a new thing asked in the conversation: its first words, and a number if they are taken. */
export function orderName(text, taken) {
    const base = nameFor(String(text).trim().split(/\s+/).slice(0, 6).join(' ')).slice(0, 40).replace(/[-_]+$/, '') || 'demande';
    let name = base;
    for (let n = 2; taken.includes(name); n++) name = `${base}-${n}`;
    return name;
}

/**
 * When the person said something about an item: the list of its versions is
 * asked again each time they have.
 */
export const versionsOf = {
    /** The moments to ask the server about: one per thing the person said. */
    dates: fiche => (fiche?.entries ?? []).filter(entry => entry.author === 'person').map(entry => entry.date),
};
