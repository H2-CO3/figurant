// The atelier page. Five workshops share one layout: animations (one playing
// for real on a neutral page), characters, emoji figures and props (one of
// them on a bench, to look at closely and pose), and scenes (several characters
// in time). A sixth button is the whiteboard. One box to write in: an
// assistant cannot see motion or judge a drawing; what a person says here is
// written to a file (a fiche) that the assistant reads.
//
// This file only starts the page. Each part of it lives in page/:
//
//   dom.js         finding and making elements, what is remembered, calls to the server
//   project.js     the project and where the person is in it (state; draws nothing)
//   draw.js        draw(): the page drawn again from what is known
//   list.js        the list of items beside the picture, the tabs
//   stage.js       the work zone: what plays, its size, pause, speed, width
//   timeline.js    time: the bar, the timeline of a scene, going to a moment
//   talk.js        the conversation: the box, what a message is about, questions, orders
//   assistant.js   whether an assistant listens, what it works on, following it
//   versions.js    before and after: earlier versions from the project's history
//   export.js      Export: a folder for a website and a GIF
//   thumbs.js      the small pictures of the lists
//   styles.js      styles: the picker, the form, the page's colours
//   custom.js      an emoji or a picture for a head
//   pins.js        pointing at a spot of the picture
//   whiteboard.js  the sheet to draw on
//   activity.js    what the person does, noted for the assistant
//
// Beside them, with no page in them: i18n.js (the words, in two languages),
// orders.js, board.js, film.js, gif.js, theme.js, where.js, hold.js.
//
// The modules call each other's functions freely; none of them runs another's
// code while it loads: whatever starts the page is below.

import { t, translate, setLanguage } from './i18n.js';
import { latestPointer } from './orders.js';
import { $, remember, keep } from './page/dom.js';
import { view, made, go } from './page/project.js';
import { note, here } from './page/activity.js';
import { draw } from './page/draw.js';
import { load, forgetTools } from './page/stage.js';
import { tick } from './page/timeline.js';
import { refresh, ready, attend } from './page/talk.js';
import { listening } from './page/assistant.js';
import { loadStyles } from './page/styles.js';

for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => { setLanguage(button.dataset.lang); translate(); forgetTools(); draw(); });
}

// Space plays and pauses, as in any player, unless the person is writing.
addEventListener('keydown', event => {
    if (event.code !== 'Space' || /^(TEXTAREA|INPUT|SELECT|BUTTON|SUMMARY)$/.test(document.activeElement?.tagName ?? '') || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    $('pause').click();
});

// Is an assistant listening for what is written here? The person should know before they write.
setInterval(listening, 4000);
listening();
loadStyles().then(() => { draw(); load(); });
setInterval(tick, 200);
// The LLM answers in the files: pick its answers up without a reload.
setInterval(refresh, 3000);

await refresh();
// An answer may have made something under another name than the one ordered,
// or beside what was asked about: go to the latest one, once, so that the
// person sees the result and not an empty stage.
const pointer = latestPointer(view.fiches, made);
if (pointer && remember('followed') !== pointer.key) {
    keep('followed', pointer.key);
    go(pointer.shop, pointer.name);
    draw();
}
if (remember('advanced') === '1') { $('advanced').hidden = false; document.querySelector('.layout').classList.add('wide'); }
// The conversation grows and shrinks with what is in it: the page keeps room to scroll clear of it.
load();
attend();
note('open', { shop: view.shop }); note('pick', here());
ready();
listening();
if (remember('reloaded') === '1') { keep('reloaded', '0'); $('saved').textContent = t('reloaded'); }
