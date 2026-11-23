// The morning post: the moon is still up, on the far side of the sky; the sun
// comes up behind its hill, the moon wanes, goes down and leaves; the sun
// climbs into the sky, and by its light the little house goes to fetch a letter. Two cut-paper animations in a row,
// with a nod between them.

export const morningPost = {
    title: 'The morning post',
    style: 'papier-decoupe',
    width: 1180,
    length: 26500,
    loop: true,
    cast: [
        { id: 'sun', character: 'paper-sun', at: -470 },
        { id: 'house', character: 'paper-house', at: 250 },
        // Its numbers are given here so that every turn of the loop starts from the same moon.
        { id: 'moon', character: 'paper-moon', at: 480, dir: -1, state: { lit: 0.75, lid: 0.8, wide: 0 } },
    ],
    tracks: {
        sun: [
            { at: 0, play: 'sunrise-paper-sun' },
            // Risen, it goes up into the sky: the floor is the house's from here on.
            { at: 12800, fly: 190, over: 1400 },
            { at: 14400, move: 'look-right', over: 9500 },
            { at: 24300, move: 'wave', over: 700 },
        ],
        moon: [
            // The end of the night: up in the sky, watching the hill the sun is behind.
            { at: 0, fly: 200, over: 1 },
            { at: 700, move: 'look-left', over: 4200 },
            // Day is coming: it wanes, cut by cut, and its eyes close.
            { at: 5200, set: { lit: 0.25, lid: 0.4 }, over: 3200 },
            { at: 8700, set: { wide: 1, lid: 1 }, over: 200 },
            { at: 9500, set: { wide: 0, lid: 0.5 }, over: 400 },
            // It comes down and goes to bed, before the house wakes.
            { at: 10300, fly: 0, over: 1500 },
            { at: 12000, exit: 'right', pace: 1.2 },
        ],
        house: [
            { at: 500, move: 'look-left', over: 11000 },
            { at: 14000, play: 'post-paper-house' },
            { at: 24800, move: 'blink' },
        ],
    },
};
