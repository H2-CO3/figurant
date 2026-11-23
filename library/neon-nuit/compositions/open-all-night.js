// Open all night: the diner cup gets its sign going, then the cassette puts
// the music on. Two signs of the same street, switching on in turn.

export const openAllNight = {
    title: 'Open all night',
    style: 'neon-nuit',
    width: 940,
    length: 28500,
    loop: true,
    cast: [
        { id: 'cup', character: 'diner-cup', at: -280 },
        { id: 'tape', character: 'cassette', at: 150 },
    ],
    tracks: {
        cup: [
            { at: 0, play: 'opening-time-diner-cup' },
            { at: 12900, move: 'look-right', over: 13000 },
            { at: 27000, move: 'hop' },
        ],
        tape: [
            { at: 375, move: 'look-left', over: 12000 },
            { at: 13125, play: 'rewind-cassette' },
            { at: 27375, move: 'blink' },
        ],
    },
};
