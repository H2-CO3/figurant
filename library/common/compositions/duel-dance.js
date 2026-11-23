// A duel that ends in a dance: two stick figures fight with swords of light,
// one blue, one red (clashes, somersaults, a parry, each throwing the other
// about from afar, then a chair and a couch, blades locked until they go out), then walk up to each other
// and tap dance side by side, one a beat behind the other.

export const duelDance = {
    title: 'A duel, then a dance',
    style: 'default',
    width: 460,
    length: 36500,
    loop: true,
    cast: [
        { id: 'left', character: 'stickman', at: -62 },
        { id: 'right', character: 'stickman', at: 62, dir: -1 },
    ],
    tracks: {
        // Both parts start at the same instant: the duel keeps them together from there.
        left: [
            { at: 400, play: 'duel-stickman', with: { part: 'first', colour: '#2f7df6' } },
            { at: 25100, walk: -34, pace: 0.8 },
            { at: 26400, play: 'tap-dance-stickman' },
        ],
        right: [
            { at: 400, play: 'duel-stickman', with: { part: 'second', colour: '#e5383b' } },
            { at: 25400, walk: 34, pace: 0.8 },
            { at: 26800, play: 'tap-dance-stickman' },
        ],
    },
};
