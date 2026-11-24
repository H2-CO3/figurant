// Everything drawn in the "trait-et-or" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { compass } from './characters/compass.js';
import { balance } from './characters/balance.js';
import { boat } from './characters/boat.js';
import { pirate } from './characters/pirate.js';
import { quay as quayCharacter } from './characters/harbour-quay.js';
import { drawNearHarbourQuay } from './scenes/harbour-quay/draw-near.js';
import { aboardPirate } from './scenes/pirate/aboard.js';
import { wetFeetPirate } from './scenes/pirate/wet-feet.js';
import { clingPirate } from './scenes/pirate/cling.js';
import { bearingPirate } from './scenes/pirate/bearing.js';
import { holdOnPirate } from './scenes/pirate/hold-on.js';
import { leapPirate } from './scenes/pirate/leap.js';
import { payPirate } from './scenes/pirate/pay.js';
import { customsOfficer } from './characters/customs-officer.js';
import { tollCustomsOfficer } from './scenes/customs-officer/toll.js';
import { watchCustomsOfficer } from './scenes/customs-officer/watch.js';
import { sailBoat } from './scenes/boat/sail.js';
import { founderBoat } from './scenes/boat/founder.js';
import { landfall } from './compositions/landfall.js';
import { setSailBoat } from './scenes/boat/set-sail.js';
import { pocketCompass } from './props/pocket-compass.js';
import { quay, goldCoin } from './props/harbour.js';
import { navigateStickman } from './scenes/stickman/navigate.js';
import { globe } from './props/globe.js';
import { weights, weight } from './props/weights.js';
import { bearingCompass } from './scenes/compass/bearing.js';
import { weighBalance } from './scenes/balance/weigh.js';

import { cabinet } from './compositions/cabinet.js';
export const style = 'trait-et-or';
export const characters = { compass, balance, boat, pirate, 'harbour-quay': quayCharacter, 'customs-officer': customsOfficer };
export const props = { globe, weights, weight, 'pocket-compass': pocketCompass, quay, 'gold-coin': goldCoin };
export const scenes = { 'bearing-compass': bearingCompass, 'weigh-balance': weighBalance, 'set-sail-boat': setSailBoat, 'navigate-stickman': navigateStickman, 'draw-near-harbour-quay': drawNearHarbourQuay, 'sail-boat': sailBoat, 'founder-boat': founderBoat, 'aboard-pirate': aboardPirate, 'wet-feet-pirate': wetFeetPirate, 'cling-pirate': clingPirate, 'bearing-pirate': bearingPirate, 'hold-on-pirate': holdOnPirate, 'leap-pirate': leapPirate, 'pay-pirate': payPirate, 'watch-customs-officer': watchCustomsOfficer, 'toll-customs-officer': tollCustomsOfficer };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'cabinet': cabinet, landfall };
