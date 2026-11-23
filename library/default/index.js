// "Default": everything made before the styles were given content of their
// own. It is a mixed bag on purpose (several looks side by side), kept
// because every item works and can be taken as it is. Each sub-folder is
// built like a style: characters/, props/, scenes/, kit.js, index.js.

import * as cartoon from './cartoon-realiste/index.js';
import * as gold from './trait-et-or/index.js';
import * as paper from './papier-decoupe/index.js';
import * as ink from './encre-de-chine/index.js';
import * as neon from './neon-nuit/index.js';

const parts = [cartoon, gold, paper, ink, neon];
export const style = 'default';
export const characters = Object.assign({}, ...parts.map(part => part.characters));
export const props = Object.assign({}, ...parts.map(part => part.props));
export const scenes = Object.assign({}, ...parts.map(part => part.scenes));

import { strike } from './compositions/strike.js';
import { penPals } from './compositions/pen-pals.js';
export const compositions = { strike, 'pen-pals': penPals };
