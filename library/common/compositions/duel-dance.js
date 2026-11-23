// A duel that ends in a dance: two stick figures fight with swords of light,
// one blue, one red, from one end of the stage to the other (clashes,
// somersaults, a parry, each throwing the other about from afar, a chair and a
// couch hurled, blades locked until they go out), then walk up to each other
// and tap dance side by side, one a beat behind the other.

export const duelDance = {
    title: 'A duel, then a dance',
    style: 'default',
    width: 700,
    length: 46200,
    loop: true,
    cast: [
        { id: 'left', character: 'stickman', at: -150 },
        { id: 'right', character: 'stickman', at: 150, dir: -1 },
    ],
    tracks: {
        // Both parts start at the same instant, and are told where they stand: the duel keeps them together from there.
        left: [
            { at: 400, play: 'duel-stickman', with: { part: 'first', colour: '#2f7df6', rival: '#e5383b', home: -150 } },
            { at: 34300, walk: -34, pace: 0.8 },
            { at: 35700, play: 'tap-dance-stickman' },
        ],
        right: [
            { at: 400, play: 'duel-stickman', with: { part: 'second', colour: '#e5383b', rival: '#2f7df6', home: 150 } },
            { at: 34600, walk: 34, pace: 0.8 },
            { at: 36100, play: 'tap-dance-stickman' },
        ],
    },
};
