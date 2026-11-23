// Walking the dog: the smallest scene worth watching. Two characters, a lead
// between them, and three moments: they set off, the dog finds a smell and
// its owner waits, they go on their way.

export const walkTheDog = {
    title: 'Walking the dog',
    // The dog is drawn in this style; its owner is the stick figure, who goes with any.
    style: 'cartoon-realiste',
    width: 640,
    length: 13500,
    loop: true,
    cast: [
        { id: 'owner', character: 'stickman', at: -250 },
        { id: 'dog', character: 'dog', at: -185 },
    ],
    ties: [{ from: 'owner:handR', to: 'dog:top', slack: 0.18 }],
    tracks: {
        dog: [
            { at: 0, walk: 80, pace: 0.8 },
            { at: 3600, play: 'sniff-dog' },
            { at: 8200, exit: 'right', pace: 0.9 },
        ],
        owner: [
            { at: 300, walk: -40, pace: 0.8 },
            { at: 4300, move: 'look-right', over: 1400 },
            { at: 6200, move: 'wave', over: 600 },
            { at: 8600, exit: 'right', pace: 0.9 },
        ],
    },
};
