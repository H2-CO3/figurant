// Landfall: a pirate captain comes into harbour in a boat that will not last
// the day. Alone at sea, under sail; the boat takes in water and goes on; up
// on the boom, round the mast, and the compass, tapped until it agrees; then
// the quay comes into sight, and is reached with the water at its heels: one
// stride off the masthead as the boat goes under. A coin for the customs
// officer, the hat lifted, and off into town.
//
// Who stands where. The floor is the water. The boat sails into the picture,
// then on the spot: the water runs under it, and at the end it is the quay
// that comes to it (the quay is in the cast for that, with the officer on its
// planks, 48 units above the water). The boat is drawn one and a half times
// its size: `by: 100`, in its own units, carries it 150 on the floor, and the
// pirate is told 150. The pirate stands in the boat, at the foot of its mast
// (19 units ahead of the boat's middle), first in the hull (12 above the
// water), then on the boom (48): it stays that high while the boat goes down
// under it. A boat's `sunk` of 0.71 brings its masthead level with the
// planks, where the quay's edge has come to (9), a stride from the mast.
// The coin: `pay-pirate` starts at 25000 and its coin lands 1960 later; the
// officer's `toll-customs-officer`, started at 24400, is told `lands: 2560`.

export const landfall = {
    title: 'Landfall',
    style: 'trait-et-or',
    width: 640,
    length: 30000,
    loop: true,
    cast: [
        // (The quay first, behind everybody; then the boat: its rig is behind the pirate, its hull over it.)
        { id: 'quay', character: 'harbour-quay', at: 540, state: { shadow: 0 } },
        { id: 'boat', character: 'boat', at: -200, scale: 1.5, state: { sunk: 0, wind: 0.6, swell: 0.15, furl: 0 } },
        { id: 'pirate', character: 'pirate', at: -181 },
        { id: 'officer', character: 'customs-officer', on: 'quay', at: 146, up: 48, dir: -1 },
    ],
    tracks: {
        boat: [
            { at: 400, play: 'sail-boat', with: { by: 100, over: 5600 } },
            { at: 6300, play: 'sail-boat', with: { over: 10500, sunk: 0.42 } },
            { at: 17000, play: 'sail-boat', with: { over: 5300, sunk: 0.71 } },
            { at: 22500, play: 'founder-boat', with: { to: 1, over: 3200 } },
        ],
        pirate: [
            { at: 0, fly: 12, over: 1 },
            { at: 400, play: 'aboard-pirate', with: { by: 150, over: 5600 } },
            { at: 6300, play: 'wet-feet-pirate' },
            { at: 8600, fly: 48, over: 450 },
            { at: 9300, play: 'cling-pirate', with: { for: 2900 } },
            { at: 12300, play: 'bearing-pirate', with: { for: 4600 } },
            { at: 17000, play: 'hold-on-pirate', with: { over: 5300 } },
            { at: 22500, play: 'leap-pirate', with: { by: 52 } },
            { at: 23900, walk: 55, pace: 0.8 },
            { at: 25000, play: 'pay-pirate', with: { to: 76 } },
            { at: 27900, exit: 'right' },
        ],
        quay: [
            { at: 17000, play: 'draw-near-harbour-quay', with: { by: -531, over: 5300 } },
        ],
        officer: [
            { at: 17000, play: 'watch-customs-officer', with: { for: 7200 } },
            { at: 24400, play: 'toll-customs-officer', with: { lands: 2560 } },
            { at: 28500, move: 'look-right', over: 1300 },
        ],
    },
};
