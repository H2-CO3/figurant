// Everything drawn in the "cut paper" style.

import { cloud } from './characters/cloud.js';
import { toadstool } from './characters/toadstool.js';
import { bush } from './props/bush.js';
import { showerCloud } from './scenes/cloud/shower.js';
import { popCapToadstool } from './scenes/toadstool/pop-cap.js';

export const style = 'default';
export const characters = { cloud, toadstool };
export const props = { bush };
export const scenes = { 'pop-cap-toadstool': popCapToadstool, 'shower-cloud': showerCloud };
