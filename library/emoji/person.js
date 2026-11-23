// A stick figure with an emoji for a head, or any picture. A kind of its own,
// kept apart from the drawn characters (it has its own workshop in the
// atelier, "Emoji & pictures", and its own folder here). One character,
// customised from that workshop: pick an emoji (and,
// if you like, others for when it blinks, is surprised or doubts), or import
// an image. The choice is saved next to this file, in person.custom.js, and
// travels with the character when it is taken to a site.
//
// An emoji is drawn by each visitor's own device: it looks different on a
// phone and on a computer, and it does not take the page's colours. Quick
// and friendly, not drawn. These are people; an animal gets an animal's
// body, fully drawn: see ../cartoon-realiste/characters/cat.js.

import { emojiHead } from 'figurant';
import custom from './person.custom.js';

/** Your own, from code: emojiPerson('robot', { face: '🤖', faces: { wide: '😵' } }). */
export const emojiPerson = (name, { face, faces, image } = {}) => ({
    name,
    line: 3,
    head: emojiHead({ face: face || '🙂', faces, image: image || undefined }),
});

export const emoji = emojiPerson('emoji', custom);
