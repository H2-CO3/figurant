// A tug of war, three against three, with a referee: everybody on the rope,
// leaning as far as they dare, heaving in time and sweating. One team gains
// ground, then the other, then the first hauls the lot of them over the line:
// the losers go down one after the other, the winners jump for joy.
// A tie from hand to hand is the rope; the common gesture `haul` does the rest.

const TEAM = [0, 1, 2];
/** One team's clips: the same for all three, each a beat after the one in front (who is nearest the middle). */
const pulls = (side, moves) => place => moves.map(([at, clip]) => ({ at: at + place * 70, ...clip(side) }));
const left = pulls(-1, [
    [600, () => ({ play: 'haul', with: { to: 0, lean: -24 } })],
    [2600, () => ({ play: 'haul', with: { to: -34, lean: -27 } })],
    [5200, () => ({ play: 'haul', with: { to: 52, lean: -14 } })],
    [7800, () => ({ play: 'haul', with: { to: -96, lean: -30, pace: 0.9, beat: 380 } })],
    [10600, () => ({ play: 'cheer' })],
    [14200, () => ({ walk: 0, pace: 0.9 })],
]);
const right = pulls(1, [
    [660, () => ({ play: 'haul', with: { to: 0, lean: 24 } })],
    [2660, () => ({ play: 'haul', with: { to: -34, lean: 14 } })],
    [5260, () => ({ play: 'haul', with: { to: 52, lean: 27 } })],
    [7860, () => ({ play: 'haul', with: { to: -96, lean: 8, pace: 0.9, beat: 380 } })],
    [10300, () => ({ set: { tilt: -84, crouch: 18, wide: 1 }, over: 240 })],
    [13000, () => ({ set: { tilt: 0, crouch: 0, wide: 0 }, over: 600 })],
    [14200, () => ({ walk: 0, pace: 0.9 })],
]);

export const tugOfWar = {
    title: 'A tug of war',
    style: 'default',
    width: 620,
    length: 16500,
    loop: true,
    cast: [
        ...TEAM.map(place => ({ id: `left-${place + 1}`, character: 'stickman', at: -56 - place * 40 })),
        ...TEAM.map(place => ({ id: `right-${place + 1}`, character: 'stickman', at: 56 + place * 40, dir: -1 })),
        { id: 'referee', character: 'stickman', at: 0, scale: 0.8 },
    ],
    // The rope: from the last of one team to the last of the other, through every front hand.
    ties: [
        { from: 'left-3:handR', to: 'left-2:handR', slack: 0.02, width: 2 }, { from: 'left-2:handR', to: 'left-1:handR', slack: 0.02, width: 2 },
        { from: 'left-1:handR', to: 'right-1:handL', slack: 0.02, width: 2 },
        { from: 'right-1:handL', to: 'right-2:handL', slack: 0.02, width: 2 }, { from: 'right-2:handL', to: 'right-3:handL', slack: 0.02, width: 2 },
    ],
    tracks: {
        ...Object.fromEntries(TEAM.map(place => [`left-${place + 1}`, left(place).map(clip => (clip.walk === 0 ? { ...clip, walk: -56 - place * 40 } : clip))])),
        ...Object.fromEntries(TEAM.map(place => [`right-${place + 1}`, right(place).map(clip => (clip.walk === 0 ? { ...clip, walk: 56 + place * 40 } : clip))])),
        // The referee starts them, stays at the middle of the rope wherever it goes, and gives the win.
        referee: [
            { at: 100, move: 'wave', over: 300 }, { at: 2640, walk: -34, pace: 0.5 }, { at: 5240, walk: 52, pace: 0.5 },
            { at: 7840, walk: -96, pace: 0.9 }, { at: 10400, move: 'hop' }, { at: 11000, move: 'wave', over: 1600 }, { at: 14200, walk: 0, pace: 0.9 },
        ],
    },
};
