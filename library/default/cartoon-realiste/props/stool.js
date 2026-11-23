// A three-legged stool: a round wooden seat, two green legs in front and a
// wooden one behind. In the library's "realistic cartoon" style; the seat is
// at the height the stick figure sits at. Origin: the floor, under its middle.

const OUTLINE = '#4a3b2e', GREEN = '#4f9d5b', GREEN_DARK = '#356f40', WOOD = '#c08a55', WOOD_DARK = '#8a5a34';
const piece = (d, fill, weight = 0.5) => ({ tag: 'path', attrs: { d, fill, stroke: OUTLINE }, weight });
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });

/** How high the seat is. */
export const STOOL = 30;

export const tabouret = {
    name: 'tabouret',
    style: 'default',
    shapes: [
        // The leg behind, in wood; then the two green legs, splayed.
        piece(`M -3 ${-STOOL + 4} L 3 ${-STOOL + 4} L 4 -3 L -2 -3 Z`, WOOD_DARK),
        piece(`M -14 ${-STOOL + 3} L -7 ${-STOOL + 3} L -14 0 L -21 0 Z`, GREEN),
        piece(`M 7 ${-STOOL + 3} L 14 ${-STOOL + 3} L 21 0 L 14 0 Z`, GREEN),
        patch(`M -9.6 ${-STOOL + 4} L -7.8 ${-STOOL + 4} L -14.8 -0.8 L -16.6 -0.8 Z`, GREEN_DARK, 0.6),
        patch(`M 11.4 ${-STOOL + 4} L 13.2 ${-STOOL + 4} L 20.2 -0.8 L 18.4 -0.8 Z`, GREEN_DARK, 0.6),
        // The seat: a thick round of wood, seen a little from above.
        piece(`M -19 ${-STOOL} Q -19 ${-STOOL + 6} 0 ${-STOOL + 6} Q 19 ${-STOOL + 6} 19 ${-STOOL} Z`, WOOD_DARK),
        { tag: 'ellipse', attrs: { cx: 0, cy: -STOOL, rx: 19, ry: 4.4, fill: WOOD, stroke: OUTLINE }, weight: 0.5 },
        { tag: 'ellipse', attrs: { cx: -4, cy: -STOOL - 0.6, rx: 9, ry: 1.6, fill: '#e9bf8c', stroke: 'none', opacity: 0.85 } },
    ],
    points: { seat: [0, -STOOL] },
};
