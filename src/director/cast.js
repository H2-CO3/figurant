// Checks on a character description, reported like marker and scene mistakes:
// each with its fix, never thrown.

import { DEFAULT_PROPORTIONS } from '../body/body.js';

/**
 * @returns {Array<{ character, field, value, message, fix }>} empty when it is sound
 */
export function checkCharacter(character) {
    const problems = [];
    const name = character?.name ?? '?';
    const report = (field, value, message, fix) => problems.push({ character: name, field, value, message, fix });

    if (typeof character?.head?.create !== 'function') {
        report('head', character?.head, 'has no head.', 'Give it head: shapeHead({ shapes, hips, shoulders, top }), or a head with create().');
        return problems;
    }
    const body = { ...DEFAULT_PROPORTIONS, ...character.proportions };
    const leg = body.thigh + body.shin;
    if (!(body.reach < leg)) {
        report('proportions.reach', body.reach, `has legs that cannot reach the ground: reach is ${body.reach} but thigh + shin is ${leg}.`,
            `Set proportions.reach below ${leg} (about ${Math.floor(leg * 0.98)} keeps the knees slightly bent).`);
    }
    const arm = body.upper + body.fore;
    if (!(arm > 0)) report('proportions.upper', body.upper, 'has no arm length.', 'Give proportions.upper and proportions.fore positive lengths.');
    return problems;
}
