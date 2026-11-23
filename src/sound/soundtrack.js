// Sound on a scene: files played at given times, kept in step with the scene's
// own time. Figurant makes no sound of its own: a cue names a sound file, and
// this plays it mechanically, so that pausing, slowing down, going to a moment
// or looping the scene does the same to what is heard.
//
//   sounds: [{ at: 1200, src: 'assets/hello.mp3', volume: 0.8 }, { at: 0, src: 'assets/rain.ogg', loop: true }]
//
// `src` is a path from the project's folder. Nothing here keeps time: `sync`
// is told the scene's time on every frame and sets each sound to match.

const KINDS = /\.(mp3|wav|ogg|oga|opus|m4a|aac|flac|webm)$/i;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/**
 * Checks the sounds of a scene.
 * @returns {Array<{ composition, field, value, message, fix }>}
 */
export function checkSounds(name, sounds) {
    const problems = [];
    const report = (field, value, message, fix) => problems.push({ composition: name, field, value, message, fix });
    if (sounds === undefined) return problems;
    if (!Array.isArray(sounds)) { report('sounds', sounds, 'has "sounds" that is not a list.', 'Write sounds: [{ at: 0, src: "assets/hello.mp3" }].'); return problems; }
    sounds.forEach((cue, i) => {
        const at = `sounds[${i}]`;
        if (!Number.isFinite(cue?.at) || cue.at < 0) report(`${at}.at`, cue?.at, 'has a sound with no start time.', 'Give at: when it starts, in milliseconds from the beginning.');
        if (typeof cue?.src !== 'string' || !KINDS.test(cue.src.split(/[?#]/)[0])) report(`${at}.src`, cue?.src, 'has a sound that names no sound file.', 'Give src: the path of a sound file from the project\'s folder, such as "assets/hello.mp3" (mp3, wav, ogg, m4a, flac or webm).');
        if (cue?.volume !== undefined && !(cue.volume >= 0 && cue.volume <= 1)) report(`${at}.volume`, cue.volume, 'has a sound with a volume out of range.', 'Give volume: a number from 0 (silent) to 1 (as recorded).');
    });
    return problems;
}

/**
 * @param {object} [options]
 * @param {Array<{ at: number, src: string, volume?: number, loop?: boolean }>} [options.sounds]
 * @param {(address: string) => object} [options.open] makes what plays a file (the browser's `Audio` when there is one; none, and nothing sounds)
 * @param {string} [options.base] the address `src` paths start from (the page's own when left out)
 * @returns {{ count: number, sync: (now: { time: number, playing?: boolean, speed?: number }) => void, stop: () => void }}
 */
export function createSoundtrack({ sounds = [], open, base } = {}) {
    const make = open ?? (globalThis.Audio ? address => new globalThis.Audio(address) : null);
    const address = src => { try { return new URL(src, base ?? globalThis.document?.baseURI).href; } catch { return src; } };
    const cues = make ? (Array.isArray(sounds) ? sounds : []).filter(cue => Number.isFinite(cue?.at) && typeof cue?.src === 'string').map(cue => ({ cue, audio: null, refused: 0, settling: 0 })) : [];
    return {
        count: cues.length,
        /** Sets every sound to where the scene is: `time` in ms since the scene began. */
        sync({ time, playing = true, speed = 1 }) {
            for (const entry of cues) {
                const { cue } = entry;
                if (!entry.audio) { entry.audio = make(address(cue.src)); entry.audio.preload = 'auto'; }
                const audio = entry.audio, local = (time - cue.at) / 1000;
                const length = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
                const over = !cue.loop && length !== null && local >= length;
                if (!playing || !(speed > 0) || local < 0 || over) { if (!audio.paused) audio.pause(); continue; }
                const want = cue.loop && length ? local % length : local;
                audio.volume = clamp(cue.volume ?? 1, 0, 1);
                audio.loop = !!cue.loop;
                const rate = clamp(speed, 0.0625, 16);
                if (audio.playbackRate !== rate) audio.playbackRate = rate;
                if (audio.paused) {
                    // A browser refuses sound until the visitor has clicked somewhere: asked again now and then, not on every frame.
                    if (entry.refused > 0) { entry.refused--; continue; }
                    audio.currentTime = want;
                    Promise.resolve(audio.play()).catch(() => { entry.refused = 30; });
                } else if (Math.abs(audio.currentTime - want) > 0.3) {
                    // Out of step: put back in its place, then left time to get there before being asked the same again.
                    // (A file served by a host that gives no part of a file cannot be moved within: asked on every frame, it would stutter.)
                    if (entry.settling > 0 && Math.abs(want - entry.aim) < 1) entry.settling--;
                    else { audio.currentTime = want; entry.aim = want; entry.settling = 30; }
                }
            }
        },
        stop() { for (const { audio } of cues) if (audio && !audio.paused) audio.pause(); },
    };
}
