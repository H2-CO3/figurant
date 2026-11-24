// The race without end: two runners of light, followed from behind down a
// circuit that is a tunnel of lines, each trailing a beam of its colour.
//
// The score. The circuit is in the cast: it draws the tunnel, and its track
// bends it one way and the other and kicks it forward. Each runner has its
// track: where it rides (`lane`: 0 the middle of the floor, 1 the foot of a
// wall; `far`: how far ahead, smaller is nearer to us), a wall taken, a
// surge. The surges are at the same moments on the three tracks.
// The two never ride through each other. To change sides, the cyan one
// goes all the way round the tunnel, up the wall and over the ceiling
// (`lane` 16 is a full turn: -15.45 is the same place as 0.55), while the
// orange one crosses the floor under it (7 to 10 s; and back, 18.5 to 22 s).
// They change places in depth only while each keeps to its side (10 to
// 17 s).
// It ends as it begins, and starts again.

export const neonRide = {
    title: 'The race without end',
    style: 'neon-nuit',
    width: 660,
    length: 24000,
    loop: true,
    cast: [
        { id: 'circuit', character: 'neon-circuit', at: 0, state: { shadow: 0, speed: 1, boost: 0, bend: 0 } },
        { id: 'cyan', character: 'neon-rider', at: 0, state: { legs: 0, shadow: 0, hue: 0, rev: 0.5, boost: 0, lane: -0.55, far: 1.75 } },
        { id: 'orange', character: 'neon-rider', at: 0, state: { legs: 0, shadow: 0, hue: 1, rev: 0.5, boost: 0, lane: 0.55, far: 1.45 } },
    ],
    tracks: {
        circuit: [
            { at: 300, set: { bend: 0.8 }, over: 2700 },
            { at: 3000, set: { bend: -0.9 }, over: 2500 },
            { at: 5500, play: 'surge-neon-circuit', with: { over: 1500 } },
            { at: 7000, set: { bend: 0.6 }, over: 3000 },
            { at: 10000, set: { bend: -0.5 }, over: 3000 },
            { at: 13000, set: { bend: 0.9 }, over: 2500 },
            { at: 15500, set: { bend: -0.3 }, over: 1500 },
            { at: 17000, play: 'surge-neon-circuit', with: { over: 1500 } },
            { at: 18500, set: { bend: -0.9 }, over: 3500 },
            { at: 22000, set: { bend: 0 }, over: 1800 },
        ],
        cyan: [
            { at: 300, set: { lane: -0.3, far: 1.8 }, over: 1400 },
            { at: 1700, set: { lane: -0.6, far: 1.7 }, over: 1300 },
            { at: 3000, play: 'climb-neon-rider', with: { side: -1, over: 2500 } },
            { at: 5500, play: 'surge-neon-rider', with: { over: 1500 } },
            { at: 7000, set: { lane: -15.45, far: 1.85 }, over: 3000 },
            { at: 10000, set: { lane: -15.4, far: 1.4 }, over: 3000 },
            { at: 13000, set: { lane: -15.65, far: 1.45 }, over: 1250 },
            { at: 14250, set: { lane: -15.35, far: 1.4 }, over: 1250 },
            { at: 15500, set: { lane: -15.4, far: 1.8 }, over: 1500 },
            { at: 17000, play: 'surge-neon-rider', with: { over: 1500 } },
            { at: 18500, set: { lane: -0.55, far: 1.8 }, over: 3500 },
            { at: 22000, set: { lane: -0.55, far: 1.75 }, over: 1800 },
        ],
        orange: [
            { at: 300, set: { lane: 0.7, far: 1.4 }, over: 1400 },
            { at: 1700, set: { lane: 0.45, far: 1.5 }, over: 1300 },
            { at: 3000, set: { lane: 0.35, far: 1.45 }, over: 2500 },
            { at: 5500, play: 'surge-neon-rider', with: { over: 1500 } },
            { at: 7000, set: { lane: -0.5, far: 1.4 }, over: 3000 },
            { at: 10000, set: { lane: -0.6, far: 1.85 }, over: 3000 },
            { at: 13000, play: 'climb-neon-rider', with: { side: -1, over: 2500 } },
            { at: 15500, set: { lane: -0.6, far: 1.45 }, over: 1500 },
            { at: 17000, play: 'surge-neon-rider', with: { over: 1500 } },
            { at: 18500, set: { lane: 0.55, far: 1.42 }, over: 3500 },
            { at: 22000, set: { lane: 0.55, far: 1.45 }, over: 1800 },
        ],
    },
};
