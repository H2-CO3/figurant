// Films what a stage page plays, frame by frame, into a GIF. The page is
// opened out of sight, held, and stepped by a fixed time between two frames,
// so the film is the same whatever the machine's speed.

import { createGif } from './gif.js';

const breath = () => new Promise(done => { const channel = new MessageChannel(); channel.port1.onmessage = () => done(); channel.port2.postMessage(0); });

/**
 * @param {object} options
 * @param {string} options.src     address of the stage page (stage.html or show.html, with its scene)
 * @param {number} [options.width] @param {number} [options.height] size of the film, in pixels
 * @param {number} [options.every] milliseconds between two frames
 * @param {number} [options.longest] stop there if the end is not known by then, in milliseconds
 * @param {(part: number) => void} [options.onProgress] 0..1
 * @returns {Promise<Uint8Array>} the GIF
 */
export async function filmGif({ src, width = 640, height = 360, every = 80, longest = 40000, onProgress = () => {} }) {
    const frame = Object.assign(document.createElement('iframe'), { width, height, title: '' });
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-99999px;top:0;border:0;visibility:hidden';
    // Held at its very start: `seek` stops the page's own clock.
    frame.src = `${src}${src.includes('?') ? '&' : '?'}seek=1`;
    document.body.append(frame);
    try {
        for (let i = 0; i < 400 && !(frame.contentWindow?.stage?.ready && !frame.contentWindow.stage.seeking); i++) await new Promise(done => setTimeout(done, 50));
        const page = frame.contentWindow, stage = page?.stage;
        if (!stage?.ready) throw new Error(stage?.problems?.[0] || 'The stage did not load.');
        const doc = page.document, look = page.getComputedStyle(doc.documentElement);
        const colours = ['--fig-ink', '--fig-paper', '--fig-accent'].map(name => `${name}:${look.getPropertyValue(name).trim()}`).join(';');
        const paper = page.getComputedStyle(doc.body).backgroundColor;
        const floor = doc.getElementById('floor'), line = floor && page.getComputedStyle(floor);
        const canvas = Object.assign(document.createElement('canvas'), { width, height }), pen = canvas.getContext('2d', { willReadFrequently: true });
        const picture = new Image();
        const draw = async () => {
            const svg = doc.querySelector('svg.fig-stage').cloneNode(true);
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('width', width); svg.setAttribute('height', height); svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.setAttribute('style', `${colours};color:${look.getPropertyValue('--fig-ink').trim()}`);
            picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
            await picture.decode();
            pen.fillStyle = paper; pen.fillRect(0, 0, width, height);
            if (floor) { const box = floor.getBoundingClientRect(); pen.fillStyle = line.borderTopColor; pen.fillRect(box.left, box.top, box.width, parseFloat(line.borderTopWidth) || 2); }
            pen.drawImage(picture, 0, 0, width, height);
            return pen.getImageData(0, 0, width, height).data;
        };
        const gif = createGif({ width, height, delay: every });
        // A scene knows its length from the start; an animation, once it has played through.
        // (The time filmed is counted here: a scene that loops starts its own clock again.)
        const known = stage.length > 0;
        let filmed = 0;
        const over = () => (known ? filmed >= stage.length : stage.length > 0 && stage.time >= stage.began + stage.length + 240) || filmed >= longest;
        while (!over()) {
            gif.add(await draw());
            stage.step(every); filmed += every;
            await breath(); await breath();
            onProgress(Math.min(0.99, filmed / (known ? stage.length : Math.max(filmed + 1500, 4000))));
        }
        onProgress(1);
        return gif.finish();
    } finally { frame.remove(); }
}
