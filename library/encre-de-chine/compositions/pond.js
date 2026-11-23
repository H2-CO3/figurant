// By the pond: the brush lays one stroke, and the frog, who watched, waits for
// its mayfly. Slow, one thing at a time, with long stillness between.

export const pond = {
    title: 'By the pond',
    style: 'encre-de-chine',
    width: 900,
    length: 32000,
    loop: true,
    cast: [
        { id: 'brush', character: 'calligraphy-brush', at: -250 },
        { id: 'frog', character: 'frog', at: 230, dir: -1 },
    ],
    tracks: {
        brush: [
            { at: 0, play: 'one-stroke-calligraphy-brush' },
            { at: 15200, move: 'look-right', over: 14000 },
        ],
        frog: [
            { at: 1700, set: { croak: 1 }, over: 1700 },
            { at: 5100, set: { croak: 0 }, over: 1700 },
            { at: 15800, play: 'still-pond-frog' },
            { at: 30300, move: 'blink' },
        ],
    },
};
