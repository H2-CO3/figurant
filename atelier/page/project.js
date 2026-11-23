// The project on show and where the person is in it: what each workshop holds
// (from figurant.config.js and from the fiches), the item looked at, who plays
// it. Every other module of the page reads this; none of it draws anything.

import { playableBy, castOf } from '/__figurant/engine/index.js';
import { t, translate } from '../i18n.js';
import { fulfilled, animationsOf, readable, talkedIn } from '../orders.js';
import { $, remember, keep } from './dom.js';

translate();

export let config;
try {
    config = (await import('/figurant.config.js')).default;
} catch (error) {
    $('problems').textContent = t('config.failed', { error: error.message });
    throw error;
}

// What each workshop holds, and the name of an item's fiche.
export const SHOPS = {
    scenes: { made: Object.keys(config.scenes || {}), prefix: '' },
    characters: { made: Object.keys(config.cast || {}), prefix: 'character-' },
    emoji: { made: Object.keys(config.emoji || {}), prefix: 'emoji-' },
    props: { made: Object.keys(config.props || {}), prefix: 'prop-' },
    // A scene: several characters, each on its track in time.
    compositions: { made: Object.keys(config.compositions || {}), prefix: 'scene-' },
};
for (const shop of Object.values(SHOPS)) { shop.all = shop.made; shop.names = shop.made; shop.fiche = name => shop.prefix + name; }
// Everyone who can play a scene: the drawn characters and the emoji figures.
export const everyone = { ...config.cast, ...config.emoji };
const characterName = cast => everyone[cast]?.character?.name;
/** A scene belongs to the character it was made for; one that names none plays on any body. */
const plays = (scene, cast) => playableBy(config.scenes[scene], characterName(cast));
export let castNames = Object.keys(everyone);
export const view = {
    shop: SHOPS[remember('shop')] ? remember('shop') : 'scenes',
    item: {}, cast: castNames.includes(remember('cast')) ? remember('cast') : castNames[0],
    width: Number(remember('width', 1440)), speed: Number(remember('speed', 1)), fiches: {}, every: remember('every') === '1',
};
for (const [shop, { names }] of Object.entries(SHOPS)) view.item[shop] = names.includes(remember('item.' + shop)) ? remember('item.' + shop) : names[0];
// A first visit opens ready to ask for something: a new animation for the stick figure
// (whoever the project has, failing that), the line to write in showing what a request looks like.
if (remember('shop') == null && remember('item.scenes') == null) { view.fresh = true; if (castNames.includes('stickman')) view.cast = 'stickman'; }

/** The styles of the project and the one in use (kept up to date by styles.js). */
export const styleBook = { active: null, styles: [] };
/** The fiche that holds remarks about the atelier's own page, whatever is on show. */
export const INTERFACE = 'atelier-interface';

export const current = () => view.item[view.shop];
export const ficheName = () => SHOPS[view.shop].fiche(current());
/** The fiche this item is talked about in: its own, or the order it came from while it has none. */
export const talkName = () => talkedIn(view.fiches, ficheName(), view.shop, current(), isMade);
/** The name shown to a person: what they called their order, a scene's title, or the file name made readable. */
export const label = (shop, name) => {
    const typed = view.fiches[SHOPS[shop].fiche(name)]?.entries[0]?.text.match(/^Name: (.+)$/m)?.[1];
    const owner = shop === 'scenes' ? castOf(config.scenes?.[name])[0] : undefined;
    return readable(name, owner, typed ?? (shop === 'compositions' ? config.compositions?.[name]?.title : undefined));
};

export const asked = fiche => {
    const last = fiche?.entries.at(-1);
    return !!last && last.author === 'person' && last.decision !== 'approve';
};

/** The style an item was drawn in, if it says so; one that says nothing belongs to every style. */
export const styleOf = (shop, name) => (shop === 'compositions' ? config.compositions?.[name]?.style : shop === 'props' ? (config.props?.[name]?.style ?? config.props?.[name]?.layers?.[0]?.style) : everyone[name]?.character?.style);
export const inStyle = (shop, name) => view.every || !styleBook.active || !styleOf(shop, name) || styleOf(shop, name) === styleBook.active;

export function listing() {
    // Only what was made in the style in use, unless the person asks to see everything.
    for (const key of ['characters', 'emoji', 'props', 'compositions']) SHOPS[key].made = SHOPS[key].all.filter(name => inStyle(key, name));
    castNames = Object.keys(everyone).filter(name => inStyle('characters', name));
    if (!castNames.includes(view.cast)) view.cast = castNames[0];
    SHOPS.scenes.made = SHOPS.scenes.all.filter(scene => castNames.some(cast => plays(scene, cast)));
    const ordered = prefix => Object.keys(view.fiches).filter(name => (prefix ? name.startsWith(prefix) : !/^(character|prop|emoji|scene|atelier)-/.test(name))).map(name => name.slice(prefix.length));
    // What was ordered and does not exist yet; an item hidden by the style filter is not an order.
    // An order the assistant made under another name is made: it is not listed as still to make.
    for (const shop of Object.values(SHOPS)) shop.names = [...new Set([...shop.made, ...ordered(shop.prefix).filter(name => !shop.all.includes(name) && !fulfilled(view.fiches[shop.fiche(name)], made))])];
    // A character's own animations, then the common gestures (never for a body without arms).
    const room = animationsOf(Object.fromEntries(SHOPS.scenes.made.map(scene => [scene, config.scenes[scene]])), everyone[view.cast]?.character ?? { name: '' });
    const mine = [...room.own, ...room.gestures];
    view.gestures = room.gestures;
    // An order for a scene is listed under the character it names.
    const orders = SHOPS.scenes.names.filter(name => !SHOPS.scenes.all.includes(name)
        && (view.fiches[name]?.entries[0]?.text.match(/^Character: (.+)$/m)?.[1] ?? view.cast) === view.cast);
    SHOPS.scenes.names = [...mine, ...orders];
    for (const [key, shop] of Object.entries(SHOPS)) if (!shop.names.includes(view.item[key])) view.item[key] = shop.names[0];
}
export const exists = () => SHOPS[view.shop].made.includes(current());
/** The workshop and the item a fiche is about, from its name ("prop-cup": props, cup). */
export const whereOf = fiche => {
    for (const [shop, { prefix }] of Object.entries(SHOPS)) if (prefix && fiche.startsWith(prefix)) return [shop, fiche.slice(prefix.length)];
    return ['scenes', fiche];
};
export const isMade = (shop, name) => !!SHOPS[shop]?.all.includes(name);
/** Whether the project has this item, whatever the style filter shows. */
export const made = (shop, name) => !!SHOPS[shop]?.all.includes(name);
/** Takes the page to an item: its workshop, and for an animation the character that plays it. */
export function go(shop, name) {
    if (!SHOPS[shop]) return;
    view.board = false;
    view.shop = shop; keep('shop', shop);
    if (shop === 'scenes' && made(shop, name)) { const owner = Object.keys(everyone).find(cast => plays(name, cast)); if (owner) { view.cast = owner; keep('cast', owner); } }
    if (name) { view.item[shop] = name; keep('item.' + shop, name); }
}
