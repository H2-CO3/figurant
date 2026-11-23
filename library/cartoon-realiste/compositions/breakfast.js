// Breakfast: the alarm clock wakes with a start, and its racket sets the
// toaster off. Two animations of this style, one after the other, each
// character watching the other while it waits.

export const breakfast = {
    title: 'Breakfast',
    style: 'cartoon-realiste',
    width: 820,
    length: 25500,
    loop: true,
    cast: [
        { id: 'clock', character: 'alarm-clock', at: -230 },
        { id: 'toaster', character: 'toaster', at: 150 },
    ],
    tracks: {
        clock: [
            { at: 0, play: 'wake-alarm-clock' },
            { at: 12600, move: 'look-right', over: 9000 },
            { at: 22600, move: 'wave', over: 900 },
        ],
        toaster: [
            { at: 600, move: 'look-left', over: 6000 },
            { at: 7200, set: { wide: 1 }, over: 120 },
            { at: 8200, set: { wide: 0 }, over: 400 },
            { at: 12200, play: 'pop-toaster' },
            { at: 23000, move: 'hop' },
        ],
    },
};
