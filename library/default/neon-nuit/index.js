// Everything drawn in the "neon at night" style.

import { star } from './characters/star.js';
import { cocktail } from './characters/cocktail.js';
import { arrow } from './props/arrow.js';
import { twinkleStar } from './scenes/star/twinkle.js';
import { cheersCocktail } from './scenes/cocktail/cheers.js';

export const style = 'default';
export const characters = { star, cocktail };
export const props = { arrow };
export const scenes = { 'cheers-cocktail': cheersCocktail, 'twinkle-star': twinkleStar };
