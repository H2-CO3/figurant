// Does a scene fit here? A scene never knows the size of the screen: it says
// how much room it needs around the character, in character units, and the
// director measures what is actually free at the moment of playing.
//
// A scene's room:  { left, right, up }   units needed on each side of the
// character's feet and above them. A scene may offer smaller variants:
//   { room: { left: 20, right: 140, up: 110 },
//     variants: [{ name: 'compact', room: { left: 20, right: 60, up: 110 } }] }

/**
 * How much room there is around a point, in character units.
 * @param {object} options
 * @param {[number, number]} options.point  where the character's feet are, page pixels
 * @param {{ left, right, top, bottom }} options.bounds the area it may use, page pixels
 *        (usually the visible part of the page, minus a margin)
 * @param {number} options.k pixels per character unit
 */
export function measureRoom({ point, bounds, k }) {
    return {
        left: Math.max(0, (point[0] - bounds.left) / k),
        right: Math.max(0, (bounds.right - point[0]) / k),
        up: Math.max(0, (point[1] - bounds.top) / k),
    };
}

const fits = (need = {}, room) =>
    (need.left ?? 0) <= room.left && (need.right ?? 0) <= room.right && (need.up ?? 0) <= room.up;

/**
 * Picks the largest version of a scene that fits, or none.
 * @returns {null | { name: string, room: object, scene: object }} `scene` is
 *          the scene with the variant's own fields laid over it. null means:
 *          do not play it. A scene is never played cramped or cut off.
 */
export function chooseVariant(scene, room) {
    const { variants = [], ...full } = scene;
    const candidates = [['full', full], ...variants.map(v => [v.name, { ...full, ...v, name: full.name }])];
    for (const [name, candidate] of candidates) {
        if (fits(candidate.room, room)) return { name, room: candidate.room || {}, scene: candidate };
    }
    return null;
}

/** Whether a scene may play on a spot, given the register its content imposes. */
export function moodAllows(scene, mood) {
    if (mood !== 'solemn') return true;
    return scene.mood === 'solemn' || scene.mood === 'any';
}
