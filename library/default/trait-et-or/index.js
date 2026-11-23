// Everything drawn in the "line and gold" style.

import { lantern } from './characters/lantern.js';
import { hourglass } from './characters/hourglass.js';
import { pedestal } from './props/pedestal.js';
import { kindleLantern } from './scenes/lantern/kindle.js';
import { turnOverHourglass } from './scenes/hourglass/turn-over.js';

export const style = 'default';
export const characters = { lantern, hourglass };
export const props = { pedestal };
export const scenes = { 'turn-over-hourglass': turnOverHourglass, 'kindle-lantern': kindleLantern };
