// A style's theme: four colours (paper, ink, accent, and a bright one for what
// must be seen first: "New", the playhead), and what follows from them: the
// colour of what is written on the accent and on the bright one, chosen to be
// read. Used by the page and by the server, which sends the page already in
// its colours.

const COLOUR = /^#[0-9a-f]{6}$/i;
export const THEME_KEYS = ['paper', 'ink', 'accent', 'pop'];

/** Dark or white, whichever reads better on a colour (by its relative luminance). */
export function onColour(colour) {
    if (!COLOUR.test(colour ?? '')) return '#16181d';
    const [r, g, b] = [1, 3, 5].map(at => parseInt(colour.slice(at, at + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#16181d' : '#ffffff';
}

/** The CSS variables a theme sets: its colours (only real ones), and the words' colours that follow. */
export function themeVars(theme) {
    const out = {};
    for (const key of THEME_KEYS) if (COLOUR.test(theme?.[key] ?? '')) out[`--${key}`] = theme[key].toLowerCase();
    for (const key of ['accent', 'pop']) if (out[`--${key}`]) out[`--on-${key}`] = onColour(out[`--${key}`]);
    return out;
}
