// Everything drawn in the "ink wash" style.

import { crane } from './characters/crane.js';
import { bonsai } from './characters/bonsai.js';
import { rock } from './props/rock.js';
import { bowCrane } from './scenes/crane/bow.js';
import { gustBonsai } from './scenes/bonsai/gust.js';

export const style = 'default';
export const characters = { crane, bonsai };
export const props = { rock };
export const scenes = { 'gust-bonsai': gustBonsai, 'bow-crane': bowCrane };
