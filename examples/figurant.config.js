// This repository's own project file: the reference character, the emoji
// figure, and the library, style by style. `node cli/figurant.js atelier`
// shows them.
import { stickman, props as basics } from '../src/index.js';
import { emoji } from '../library/emoji/person.js';
import * as common from '../library/common/index.js';
import * as defaults from '../library/default/index.js';
import * as cartoon from '../library/cartoon-realiste/index.js';
import * as gold from '../library/trait-et-or/index.js';
import * as paper from '../library/papier-decoupe/index.js';
import * as ink from '../library/encre-de-chine/index.js';
import * as neon from '../library/neon-nuit/index.js';

/** The styles of the library. Each is a folder built the same way. */
const styles = [defaults, cartoon, gold, paper, ink, neon];

const size = { unit: 1.5, scale: 0.75 };
const sized = characters => Object.fromEntries(Object.entries(characters).map(([name, character]) => [name, { character, ...size }]));

export default {
    cast: {
        // The stick figure belongs to the default style, with everything made of it.
        stickman: { character: { ...stickman, style: 'default' }, ...size },
        ...Object.assign({}, ...styles.map(style => sized(style.characters))),
    },
    // A kind apart: stick figures whose head is an emoji or an imported picture.
    emoji: {
        emoji: { character: emoji, ...size },
    },
    scenes: { ...common.scenes, ...Object.assign({}, ...styles.map(style => style.scenes)) },
    props: { ...basics, ...Object.assign({}, ...styles.map(style => style.props)) },
    // Special effects, ready to use in an animation.
    effects: { ...common.effects },
    // Scenes: several characters, each on its track in time.
    compositions: { ...common.compositions, ...Object.assign({}, ...styles.map(style => style.compositions ?? {})) },
    // The style a fresh copy starts in (the person changes it from the atelier).
    style: 'default',
    // Characters a person may customise from the atelier, and where each choice is saved.
    custom: { emoji: 'library/emoji/person.custom.js' },
};
