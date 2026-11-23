// Everything drawn in the "cartoon-realiste" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { toaster } from './characters/toaster.js';
import { alarmClock } from './characters/alarm-clock.js';
import { butteredToast } from './props/buttered-toast.js';
import { bedsideTable } from './props/bedside-table.js';
import { popToaster } from './scenes/toaster/pop.js';
import { wakeAlarmClock } from './scenes/alarm-clock/wake.js';

import { tabby } from './characters/tabby.js';
import { backflipTabby } from './scenes/tabby/backflip.js';
import { dog } from './characters/dog.js';
import { sniffDog } from './scenes/dog/sniff.js';

import { breakfast } from './compositions/breakfast.js';
export const style = 'cartoon-realiste';
export const characters = { dog, tabby, toaster, 'alarm-clock': alarmClock };
export const props = { 'buttered-toast': butteredToast, 'bedside-table': bedsideTable };
export const scenes = {
    'sniff-dog': sniffDog, 'backflip-tabby': backflipTabby, 'pop-toaster': popToaster, 'wake-alarm-clock': wakeAlarmClock };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'breakfast': breakfast };
