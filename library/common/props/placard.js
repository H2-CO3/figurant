// A placard on its pole: a board with a word on it. It belongs to no style: a
// plain board in the page's ink and paper, for anybody with a hand to hold.
// Origin: where the hand holds the pole.

/** @param {string} text the word on the board (short: it is read at a glance) */
export const placard = (text = '!') => ({
    name: 'placard',
    shapes: [
        { tag: 'path', attrs: { d: 'M 0 16 L 0 -44' }, weight: 1 },
        { tag: 'path', attrs: { d: 'M -34 -88 L 34 -88 L 34 -44 L -34 -44 Z' }, fill: true, weight: 1 },
        { tag: 'text', text, attrs: { x: 0, y: -66, 'font-size': Math.min(26, 110 / Math.max(3, text.length)), 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui, sans-serif', 'font-weight': 800 } },
    ],
    points: { grip: [0, 0], top: [0, -88] },
});
