// A GIF writer, small and with no dependency: frames go in as RGBA, a looping
// GIF89a comes out. Colours (5 bits a channel): each frame brings its own
// palette, the 255 commonest colours of what changed in it, and the nearest of
// them for the rest; so a colour that comes late into a film is still that
// colour. A pixel that has not changed since the frame before is left
// transparent, and only the rectangle that changed is written: a still
// background costs nothing. Pure: it runs in a page and under Node alike.

const TRANSPARENT = 255;

/** GIF's LZW: codes of growing width, packed least significant bit first, in blocks of at most 255 bytes. */
function lzw(indices, out) {
    const MIN = 8, CLEAR = 256, END = 257;
    out.push(MIN);
    let block = [], acc = 0, bits = 0;
    const flush = () => { if (block.length) { out.push(block.length, ...block); block = []; } };
    const byte = value => { block.push(value); if (block.length === 255) flush(); };
    let size = MIN + 1;
    const emit = code => { acc |= code << bits; bits += size; while (bits >= 8) { byte(acc & 255); acc >>>= 8; bits -= 8; } };
    // The table of strings seen so far: (prefix code, next byte) -> code.
    let table = new Map(), next = END + 1;
    emit(CLEAR);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
        const value = indices[i], key = (prefix << 8) | value, known = table.get(key);
        if (known !== undefined) { prefix = known; continue; }
        emit(prefix);
        if (next < 4096) {
            table.set(key, next++);
            if (next > (1 << size) && size < 12) size++;
        } else { emit(CLEAR); table = new Map(); next = END + 1; size = MIN + 1; }
        prefix = value;
    }
    emit(prefix); emit(END);
    if (bits) byte(acc & 255);
    flush();
    out.push(0);
}

/**
 * @param {{ width: number, height: number, delay: number }} film `delay`: milliseconds a frame stays
 * @returns {{ add(rgba: Uint8ClampedArray | Uint8Array): void, finish(): Uint8Array }}
 */
export function createGif({ width, height, delay }) {
    const chunks = [];
    let common = null;                              // the first frame's colours, for readers that want a palette for the film
    let before = null;                              // each pixel's colour in the frame before, by its 15-bit name
    const word = value => [value & 255, (value >> 8) & 255];
    const channels = name => [((name >> 10) & 31) << 3 | 4, ((name >> 5) & 31) << 3 | 4, (name & 31) << 3 | 4];

    return {
        add(rgba) {
            const now = new Uint16Array(width * height);
            // What changed, and the rectangle that holds it.
            let left = width, top = height, right = -1, bottom = -1;
            for (let i = 0, p = 0; i < now.length; i++, p += 4) {
                now[i] = ((rgba[p] >> 3) << 10) | ((rgba[p + 1] >> 3) << 5) | (rgba[p + 2] >> 3);
                if (before && before[i] === now[i]) continue;
                const x = i % width, y = (i - x) / width;
                if (x < left) left = x; if (x > right) right = x; if (y < top) top = y; if (y > bottom) bottom = y;
            }
            const control = [0x21, 0xf9, 4, 0b0000_0101, ...word(Math.round(delay / 10)), TRANSPARENT, 0];   // keep what is drawn; one colour is "see through"
            // A frame in which nothing changed is one pixel, to keep the time it lasts.
            if (right < 0) {
                const chunk = [...control, 0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0];
                lzw([TRANSPARENT], chunk); chunks.push(Uint8Array.from(chunk));
                before = now;
                return;
            }
            // This frame's palette: the commonest colours among what changed.
            const count = new Map();
            for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
                const i = y * width + x;
                if (before && before[i] === now[i]) continue;
                count.set(now[i], (count.get(now[i]) ?? 0) + 1);
            }
            const names = [...count].sort((a, b) => b[1] - a[1]).slice(0, TRANSPARENT).map(([name]) => name);
            const palette = names.map(channels), placed = new Map(names.map((name, index) => [name, index]));
            const place = name => {
                let index = placed.get(name);
                if (index !== undefined) return index;
                // More colours than a frame holds: the nearest one it has.
                const [r, g, b] = channels(name);
                let far = Infinity; index = 0;
                for (let i = 0; i < palette.length; i++) { const c = palette[i], d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < far) { far = d; index = i; } }
                placed.set(name, index);
                return index;
            };
            const w = right - left + 1, h = bottom - top + 1, shown = new Uint8Array(w * h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const i = (top + y) * width + left + x;
                if (before && before[i] === now[i]) { shown[y * w + x] = TRANSPARENT; continue; }
                const index = place(now[i]);
                shown[y * w + x] = index;
                // What is shown is what the next frame is compared with: a pixel given a neighbour's colour is drawn again when its own turns up.
                now[i] = names[index];
            }
            const table = new Uint8Array(768);
            palette.forEach((colour, i) => table.set(colour, i * 3));
            common ??= table;
            const chunk = [...control, 0x2c, ...word(left), ...word(top), ...word(w), ...word(h), 0x87, ...table];   // its own table of 256 colours
            lzw(shown, chunk);
            chunks.push(Uint8Array.from(chunk));
            before = now;
        },
        finish() {
            // The film's own palette is only there for readers that insist on one (a frame in which nothing changed has none of its own).
            const head = Uint8Array.from([...'GIF89a'].map(c => c.charCodeAt(0)).concat(word(width), word(height), 0xf7, 0, 0));
            const loop = Uint8Array.from([0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map(c => c.charCodeAt(0)), 3, 1, 0, 0, 0]);
            const parts = [head, common ?? new Uint8Array(768), loop, ...chunks, Uint8Array.of(0x3b)];
            const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
            let at = 0; for (const part of parts) { out.set(part, at); at += part.length; }
            return out;
        },
    };
}
