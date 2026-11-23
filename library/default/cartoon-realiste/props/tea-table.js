// What the teapot pours into: a round side table, a porcelain cup on its
// saucer, and the tea itself. Same "realistic cartoon" style and scale as the
// teapot. Origins: the floor under the table; the foot of the cup; the top of
// the stream.

const OUTLINE = '#4a3b2e', WOOD = '#8a5a34';
const piece = (d, fill, weight = 0.9) => ({ tag: 'path', attrs: { d, fill, stroke: OUTLINE }, weight });
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });
const line = (d, color, weight) => ({ tag: 'path', attrs: { d, stroke: color }, weight });

/** How high the table top is. */
export const TABLE = 40;

export const teaTable = {
    name: 'tea-table',
    style: 'default',
    shapes: [
        piece(`M -3 ${-TABLE + 5} L -3 -3 L -16 0 L -16 2 L 16 2 L 16 0 L 3 -3 L 3 ${-TABLE + 5} Z`, WOOD),
        piece(`M -28 ${-TABLE} Q -30 ${-TABLE + 2.5} -28 ${-TABLE + 5} L 28 ${-TABLE + 5} Q 30 ${-TABLE + 2.5} 28 ${-TABLE} Z`, '#c08a55'),
        patch(`M -26 ${-TABLE + 0.9} L 22 ${-TABLE + 0.9} L 20 ${-TABLE + 2.2} L -26 ${-TABLE + 2.2} Z`, '#e9bf8c', 0.9),
    ],
    points: { top: [0, -TABLE] },
};

export const teacup = {
    name: 'teacup',
    style: 'default',
    shapes: [
        piece('M -17 0 Q 0 4 17 0 L 14 -2.5 L -14 -2.5 Z', '#f3eee4'),
        line('M 11 -12 C 21 -13 21 -4 10 -5', OUTLINE, 2.6), line('M 11 -12 C 21 -13 21 -4 10 -5', '#f3eee4', 1.2),
        piece('M -12 -17 L -9 -4 Q 0 -1 9 -4 L 12 -17 Z', '#fbf8f1'),
        patch('M -9.5 -15 L -7.5 -6 L -5.5 -5.4 L -7 -15 Z', '#ffffff', 0.9),
        patch('M 5 -5 Q 9 -6 10.5 -16 L 8 -16 Q 7.5 -8 5 -5 Z', '#bfb5a2', 0.45),
        line('M -11.2 -13.6 Q 0 -11.6 11.2 -13.6', '#2f5f9e', 0.7),
    ],
    points: { rim: [0, -17], foot: [0, 0] },
};

/** The tea in the cup: a brown ellipse at the rim. Origin: the middle of the rim. */
export const tea = {
    name: 'tea',
    style: 'default',
    shapes: [{ tag: 'ellipse', attrs: { cx: 0, cy: 0.6, rx: 10.4, ry: 1.9, fill: '#a8642a', stroke: OUTLINE }, weight: 0.5 }],
    points: {},
};

/** The stream of tea, falling `length` units. Origin: where it leaves the spout. */
export const stream = length => ({
    name: 'stream',
    shapes: [line(`M 0 0 Q 3 ${(length * 0.45).toFixed(1)} 2.4 ${length}`, '#a8642a', 1.5), line(`M -0.6 2 Q 2 ${(length * 0.45).toFixed(1)} 1.6 ${length - 2}`, '#d9a05e', 0.5)],
    points: {},
});
