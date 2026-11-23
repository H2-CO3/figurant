// Which project a stage page loads: the one this server serves, or that same
// project as it was at a commit. Never an address taken from the link as it
// is: a page elsewhere could open the stage with a script of its own, and that
// script would then be the atelier, with all it may read and write.

const PAST = /^\/__figurant\/at\/[0-9a-f]{40}\/figurant\.config\.js$/;

/** @param {string} search the page's query string */
export function configAddress(search) {
    const asked = new URLSearchParams(search).get('config') ?? '';
    return PAST.test(asked) ? asked : '/figurant.config.js';
}
