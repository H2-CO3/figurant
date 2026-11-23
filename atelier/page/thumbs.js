import { el } from './dom.js';
import { view } from './project.js';
import { draw } from './draw.js';
import { stageTheme } from './styles.js';

// ── Thumbnails: each item drawn once, small, to be recognised at a glance. ────
export const thumbs = new Map();
/** A thumbnail kept from before this page was reloaded: shown at once, while the fresh one is drawn. */
export const keptThumb = key => { try { return sessionStorage.getItem('figurant.thumb.' + key); } catch { return null; } };
/** The page that draws them: it loads the project once and draws each picture still. */
let thumbPage = null;
const thumbMaker = () => thumbPage ??= new Promise(done => {
    const hidden = el('iframe', { src: 'thumbs.html', width: 420, height: 420, style: 'position:absolute;left:-9999px;top:0;border:0', title: '' });
    hidden.setAttribute('aria-hidden', 'true');
    document.body.append(hidden);
    const wait = setInterval(() => { if (hidden.contentWindow?.thumbs?.ready) { clearInterval(wait); done(hidden.contentWindow.thumbs); } }, 50);
});
/** A moment of an animation or of a scene, as a picture: its page is opened out of sight, taken to that moment, and drawn. One at a time. */
let stillFrame = null, stillLine = Promise.resolve();
const still = (kind, name, cast, wanted) => stillLine = stillLine.then(() => wanted() ? stillOf(kind, name, cast) : undefined).catch(() => null);
async function stillOf(kind, name, cast) {
    if (!stillFrame) {
        stillFrame = el('iframe', { width: 1000, height: 800, style: 'position:fixed;left:-99999px;top:0;border:0;visibility:hidden', title: '' });
        stillFrame.setAttribute('aria-hidden', 'true');
        document.body.append(stillFrame);
    }
    const loaded = new Promise(done => stillFrame.addEventListener('load', done, { once: true }));
    stillFrame.src = `${kind === 'show' ? 'show' : 'stage'}.html?${new URLSearchParams({ scene: name, ...(cast ? { cast } : {}), ...stageTheme(), seek: 1 })}`;
    await loaded;
    const page = stillFrame.contentWindow;
    for (let i = 0; i < 160 && !(page.stage?.ready && !page.stage.seeking) && !page.stage?.problems?.length; i++) await new Promise(done => setTimeout(done, 50));
    const stage = page.stage;
    if (!stage?.ready) return null;
    const svg = page.document.querySelector('svg.fig-stage');
    if (!svg) return null;
    const breath = () => new Promise(done => { const channel = new MessageChannel(); channel.port1.onmessage = () => done(); channel.port2.postMessage(0); });
    const measure = () => {
        const boxes = [...svg.querySelectorAll('[data-fig-layer]')].map(g => g.getBoundingClientRect()).filter(b => b.width > 1 && b.height > 1);
        if (!boxes.length) return null;
        const left = Math.min(...boxes.map(b => b.left)), top = Math.min(...boxes.map(b => b.top));
        const right = Math.max(...boxes.map(b => b.right)), bottom = Math.max(...boxes.map(b => b.bottom));
        return { boxes, left, top, right, bottom, side: Math.max(right - left, bottom - top), drawn: boxes.reduce((sum, b) => sum + b.width * b.height, 0), biggest: Math.max(...boxes.map(b => Math.max(b.width, b.height))) };
    };
    // The moment to show: it is played through, out of sight, and the one where the most is drawn is kept
    // (short of one where something has flown so far that the character would be a dot).
    const known = stage.length > 0, longest = known ? Math.min(stage.length, 40000) : 8000, every = known ? Math.max(100, longest / 150) : 100;
    let best = null;
    for (let filmed = 0; filmed <= longest; filmed += every) {
        // (Not the very first frames: the characters are not yet in their places.)
        const now = filmed >= 300 ? measure() : null;
        if (now && (known || now.side <= now.biggest * 2.5) && (!best || now.drawn > best.drawn * 1.03)) best = { ...now, svg: svg.cloneNode(true) };
        if (!known && stage.length > 0 && stage.time >= stage.began + stage.length) break;
        stage.step(every); await breath(); await breath();
    }
    if (!best) return null;
    let { left, top, right, bottom } = best;
    // An animation is pictured in a square; a scene, as wide as it is: its picture is a band over its name.
    const band = kind === 'show' && right - left > bottom - top;
    const side = Math.max(right - left, bottom - top) + 12, cx = (left + right) / 2;
    const [wide, high] = band ? [right - left + 24, Math.max(bottom - top + 16, (right - left + 24) / 3.4)] : [side, side];
    const look = page.getComputedStyle(page.document.documentElement);
    const picture = best.svg;
    picture.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    picture.setAttribute('viewBox', `${cx - wide / 2} ${bottom + 8 - high} ${wide} ${high}`);
    picture.setAttribute('width', String(Math.round(88 * wide / high))); picture.setAttribute('height', '88');
    picture.setAttribute('style', ['--fig-ink', '--fig-paper', '--fig-accent'].map(key => `${key}:${look.getPropertyValue(key).trim()}`).join(';') + `;color:${look.getPropertyValue('--fig-ink').trim()}`);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(picture));
}
export async function thumbnail(kind, name, cast = '') {
    const key = [kind, name, cast].filter(Boolean).join(':');
    if (thumbs.has(key)) return;
    thumbs.set(key, null);
    let picture;
    if (kind === 'scene' || kind === 'show') {
        // Its turn may come after the person has gone elsewhere: then it is not drawn, and will be asked for again.
        const wanted = () => kind === 'show' ? view.shop === 'compositions' : view.shop === 'scenes' && view.cast === cast;
        picture = await still(kind, name, cast, wanted);
        if (picture === undefined) { thumbs.delete(key); return; }
    }
    else {
        const maker = await thumbMaker();
        // One per frame, so that the page stays lively while they come.
        await new Promise(done => requestAnimationFrame(done));
        picture = maker.draw(kind, name);
    }
    thumbs.set(key, picture || false);
    if (picture) try { sessionStorage.setItem('figurant.thumb.' + key, picture); } catch { /* no room: it will be drawn again */ }
    clearTimeout(thumbnail.redraw);
    thumbnail.redraw = setTimeout(draw, 60);
}
