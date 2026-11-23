// A tug of war: two stick figures, a rope between their hands. They lean back,
// one gains ground, then the other, until one is pulled over and the winner
// jumps for joy. A tie between their hands, and the common gesture `haul`.

export const tugOfWar = {
    title: 'A tug of war',
    style: 'default',
    width: 420,
    length: 12500,
    loop: true,
    cast: [
        { id: 'left', character: 'stickman', at: -58 },
        { id: 'right', character: 'stickman', at: 58, dir: -1 },
    ],
    ties: [{ from: 'left:handR', to: 'right:handL', slack: 0.03, width: 1.8 }],
    tracks: {
        left: [
            { at: 400, play: 'haul', with: { to: 0, lean: -14 } },
            { at: 1500, play: 'haul', with: { to: -26, lean: -16 } },
            { at: 3400, play: 'haul', with: { to: 50, lean: -9 } },
            { at: 5300, play: 'haul', with: { to: -62, lean: -18, pace: 0.7 } },
            { at: 7300, play: 'cheer' },
            { at: 10800, walk: -58, pace: 0.8 },
        ],
        right: [
            { at: 500, play: 'haul', with: { to: 0, lean: 14 } },
            { at: 1560, play: 'haul', with: { to: -26, lean: 9 } },
            { at: 3460, play: 'haul', with: { to: 50, lean: 16 } },
            { at: 5360, play: 'haul', with: { to: -62, lean: 6, pace: 0.7 } },
            { at: 7060, set: { tilt: -78, crouch: 16 }, over: 260 },
            { at: 9800, set: { tilt: 0, crouch: 0 }, over: 500 },
            { at: 10800, walk: 58, pace: 0.8 },
        ],
    },
};
