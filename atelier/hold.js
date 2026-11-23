// A page whose clock is held is moved on by hand: by the GIF's film, by the
// pictures of the lists, by "next frame".

/** Advances a held clock by `ms`: in as many ticks as it takes, a clock taking 50 ms at most in one. */
export const advance = (clock, ms) => { for (let left = ms; left > 1e-9; left -= 50) clock.tick(Math.min(50, left)); };
