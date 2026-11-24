// The quay as somebody of a scene: the prop of the same name
// (../props/harbour.js), given a place in a cast so that it can come into
// the picture (a boat that sails on the spot sees the land come to it), and
// carry whoever stands on its planks (`on: 'quay', up: 48`, `quay` being its id in the cast). It has no face
// and no limbs. Its place is the foot of its first pile, at the water.

import { shapeHead } from 'figurant';
import { quay as drawn, QUAY } from '../props/harbour.js';

/** (A prop's shapes say their weight as a share of the line; a head's shapes say their stroke.) */
const LINE = 2.6;
const shapes = drawn.shapes.map(shape => ({ ...shape, attrs: { 'stroke-width': LINE * (shape.weight ?? 1), ...shape.attrs } }));

export const quay = {
    name: 'harbour-quay',
    style: 'trait-et-or',
    line: LINE,
    limbs: 'none',
    arms: 'none',
    sits: false,
    head: shapeHead({ shapes, hips: [[-2, -2], [2, -2]], shoulders: [[0, -QUAY], [40, -QUAY]], top: [52, -QUAY - 100] }),
    proportions: { thigh: 4, shin: 4, reach: 2, stride: 6, lift: 0, upper: 4, fore: 4 },
};
