// What the person does here is noted for the assistant, silently: nothing on
// the page reacts to it and nobody is woken. Never what they type. See cli/activity.js.

import { view } from './project.js';

const noted = [];
export const note = (what, detail = {}) => { noted.push({ what, ...detail }); };
/** Where the person is: what they look at, and who plays it. */
export const here = () => ({ shop: view.shop, item: view.item[view.shop], ...(view.shop === 'scenes' ? { cast: view.cast } : {}) });
setInterval(() => {
    if (!noted.length) return;
    fetch('/__figurant/api/activity', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: noted.splice(0) }) }).catch(() => {});
}, 1500);
