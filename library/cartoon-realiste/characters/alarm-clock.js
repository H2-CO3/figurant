// A twin-bell alarm clock, in the "cartoon réaliste" style: a round case of
// red enamel, a brass bezel, a cream dial under glass, two gilt bells with a
// hammer between them and a carrying handle over the top. Its eyes sit on
// the dial; its two hands, at a quarter past nine, are its moustache.
// What is its own:
// - `ring` (0 silent -> 1 ringing): the hammer beats between the bells, the
//   bells shiver, the case shakes, its mouth opens;
// - `hour` (the time it shows, in hours: 9.25 is a quarter past nine): both
//   hands turn with it;
// - surprise (`wide`) makes the bells hop and curls the moustache up;
// - the hammer and the bells are loose: they trail behind a move (`drag`).
// `mouth` (0 to 1) opens its mouth by itself, for a yawn.
//
// Numbers it adds: gazeX, gazeY, lid, wide, squint, pupil, ring, hour, mouth.

import { kit } from '../kit.js';

const OUTLINE = '#3a2622', INK = '#2e2320';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
/** The time it shows at rest: a straight moustache. */
export const QUARTER_PAST_NINE = 9.25;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const enamel = k.radial([[0, '#ff9682'], [0.4, '#e4472f'], [1, '#9a2315']], [0.3, 0.26, 0.9]);
        const gilt = k.radial([[0, '#fff8d6'], [0.45, '#ecbd55'], [1, '#9a6a16']], [0.34, 0.28, 0.85]);
        const brass = k.linear([[0, '#fff0b8'], [0.5, '#e0b045'], [1, '#96691a']], [0, 0, 1, 1]);
        const steel = k.linear([[0, '#f7fafc'], [0.5, '#b9c3cc'], [1, '#727d88']], [0, 0, 0, 1]);
        const paper = k.radial([[0, '#fffdf5'], [0.7, '#f7edd4'], [1, '#dccba4']], [0.4, 0.36, 0.75]);

        // Behind the case: the handle, the ringing marks, the hammer, the bells, the feet.
        k.line(group, 'M -29 -55 Q 0 -83 29 -55', OUTLINE, 7);
        k.line(group, 'M -29 -55 Q 0 -83 29 -55', '#d8402f', 3.4);
        k.line(group, 'M -20 -62.5 Q -8 -70 4 -70.4', '#ffb3a3', 1, { opacity: 0.9 });
        const marks = [-1, 1].map(side => k.line(group, `M ${side * 47} -52 L ${side * 55} -57 M ${side * 43} -62 L ${side * 48} -71 M ${side * 51} -43 L ${side * 61} -44`, '#e9b94e', 2.2, { opacity: 0 }));

        const hammer = stage.el('g', group);
        k.line(hammer, 'M 0 -36 L 0 -54', OUTLINE, 4.4);
        k.line(hammer, 'M 0 -36 L 0 -54', '#c3ccd4', 1.8);
        k.shape(hammer, 'M -5.5 -60 L 5.5 -60 Q 8.5 -60 8.5 -56.6 Q 8.5 -53.2 5.5 -53.2 L -5.5 -53.2 Q -8.5 -53.2 -8.5 -56.6 Q -8.5 -60 -5.5 -60 Z', steel, OUTLINE, 1.7);
        k.line(hammer, 'M -5 -58.2 L 3 -58.2', '#ffffff', 0.9, { opacity: 0.9 });

        const bells = [-1, 1].map(() => {
            const g = stage.el('g', group);
            k.line(g, 'M 0 -2 L 0 9', OUTLINE, 5);
            k.line(g, 'M 0 -2 L 0 9', '#c79a36', 2.4);
            stage.el('circle', g, { cx: 0, cy: -17, r: 2.9, fill: gilt, stroke: OUTLINE, 'stroke-width': 1.5 });
            k.shape(g, 'M -16.5 0 C -17 -21 17 -21 16.5 0 Q 0 3.4 -16.5 0 Z', gilt, OUTLINE, 2);
            k.patch(g, 'path', { d: 'M 15.6 -0.6 C 16 -11 11 -15 5 -15.6 C 10 -12 12 -7 10 0.6 Z' }, '#6e4708', 0.32);
            k.patch(g, 'ellipse', { cx: -7.5, cy: -8.6, rx: 2.6, ry: 5.4, transform: 'rotate(32 -7.5 -8.6)' }, '#ffffff', 0.85);
            return g;
        });
        for (const side of [-1, 1]) k.shape(group, `M ${side * 24} 30 L ${side * 21.5} 42 L ${side * 10.5} 42 L ${side * 11} 35 Z`, gilt, OUTLINE, 1.9);

        // The case: enamel, a shade on the lower right, a light on the upper left.
        const body = stage.el('g', group);
        stage.el('circle', body, { cx: 0, cy: 0, r: 40, fill: enamel, stroke: OUTLINE, 'stroke-width': 2.4 });
        k.patch(body, 'path', { d: 'M 39 -5 A 39 39 0 0 1 -5 39 A 50 50 0 0 0 39 -5 Z' }, '#4f0d06', 0.34);
        k.line(body, 'M -34.6 -8.5 A 35.6 35.6 0 0 1 -12 -33.6', '#ffffff', 2.6, { opacity: 0.8 });
        k.patch(body, 'circle', { cx: -35.4, cy: -1.5, r: 1.5 }, '#ffffff', 0.8);
        // The bezel and the dial.
        stage.el('circle', body, { cx: 0, cy: 0, r: 32.6, fill: brass, stroke: OUTLINE, 'stroke-width': 1.7 });
        stage.el('circle', body, { cx: 0, cy: 0, r: 29.4, fill: paper, stroke: '#7a5a2a', 'stroke-width': 1 });
        for (let i = 0; i < 12; i++) {
            const quarter = i % 3 === 0;
            k.line(body, `M 0 ${quarter ? -23.6 : -25.4} L 0 -27.6`, '#5a4636', quarter ? 2 : 1.1, { transform: `rotate(${i * 30})` });
        }
        k.patch(body, 'ellipse', { cx: -19.5, cy: 7.5, rx: 5, ry: 3 }, '#f08f8f', 0.4);
        k.patch(body, 'ellipse', { cx: 19.5, cy: 7.5, rx: 5, ry: 3 }, '#f08f8f', 0.4);

        // The hands, the hub (its nose), then the face over them.
        const hourHand = k.shape(body, 'M -1.9 3 L -1.2 -12 L 0 -15 L 1.2 -12 L 1.9 3 Z', INK, INK, 0.8);
        const minuteHand = k.shape(body, 'M -1.5 3.6 L -0.9 -19 L 0 -22 L 0.9 -19 L 1.5 3.6 Z', INK, INK, 0.8);
        stage.el('circle', body, { cx: 0, cy: 0, r: 2.9, fill: brass, stroke: OUTLINE, 'stroke-width': 1.2 });
        k.patch(body, 'circle', { cx: -0.8, cy: -0.9, r: 0.8 }, '#ffffff', 0.9);
        const eyes = [[-11.5, -11], [11.5, -11]].map(at => k.eye(body, at, { r: 8, iris: '#3a8a86', outline: OUTLINE }));
        const mouth = k.shape(body, '', '#7a2f2f', OUTLINE, 1.6);
        // The glass: one curved glint.
        k.patch(body, 'path', { d: 'M -26.4 -6 A 27 27 0 0 1 -6 -26.4 A 34 34 0 0 0 -26.4 -6 Z' }, '#ffffff', 0.55);

        const frame = { hips: [[-16, 42], [16, 42]], shoulders: [[-39.5, 2], [39.5, 2]], hipY: 42, top: [0, -69], soft: 0.6 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, pupil: 1, ring: 0, hour: QUARTER_PAST_NINE, mouth: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), squint = clamp(s.squint, 0, 1), ring = clamp(s.ring, 0, 1);
                const t = s.clock;

                // Ringing: the hammer beats from one bell to the other and the case shakes.
                // Without it the hammer is loose and trails behind a move.
                const beat = Math.sin(t * 0.085);
                hammer.setAttribute('transform', `rotate(${f(clamp(24 * ring * beat + drag[0] * 1.6 * (1 - ring), -26, 26))} 0 -36)`);
                body.setAttribute('transform', `rotate(${f(2.6 * ring * Math.sin(t * 0.07))}) translate(${f(0.9 * ring * beat)} 0)`);
                // The bells: surprise and a fall lift them off the case, a move tips them, ringing shivers them.
                const hop = 5.5 * wide + clamp(-drag[1] * 0.8, 0, 8);
                bells.forEach((bell, i) => {
                    const side = i ? 1 : -1;
                    const tip = side * 33 + clamp(drag[0] * 0.9, -7, 7) + 4 * ring * Math.sin(t * 0.085 + i * 2);
                    bell.setAttribute('transform', `translate(${side * 23.5} -38.5) rotate(${f(tip)}) translate(0 ${f(-hop)})`);
                });
                marks.forEach((mark, i) => mark.setAttribute('opacity', f(ring * (0.55 + 0.45 * Math.sin(t * 0.03 + i * 3)))));

                // The hands: the time, and a moustache that curls up in surprise.
                const hour = ((s.hour % 12) + 12) % 12;
                hourHand.setAttribute('transform', `rotate(${f(hour * 30 + 28 * wide)})`);
                minuteHand.setAttribute('transform', `rotate(${f((hour % 1) * 360 - 28 * wide)})`);

                for (const eye of eyes) eye(s);
                // A smile at rest; open for a yawn, a fright or the alarm; flat when it doubts.
                const open = clamp(Math.max(s.mouth, wide, ring * 0.85), 0, 1), curve = 5 * (1 - squint);
                mouth.setAttribute('d', open > 0.25
                    ? `M ${f(-4 - 2.5 * open)} 13 Q 0 ${f(11 - open)} ${f(4 + 2.5 * open)} 13 Q 0 ${f(15 + 9 * open)} ${f(-4 - 2.5 * open)} 13 Z`
                    : `M -7 11.5 Q 0 ${f(11.5 + curve)} 7 11.5 Q 0 ${f(11.5 + curve * 0.7)} -7 11.5 Z`);
            },
        };
    },
};

export const alarmClock = {
    name: 'alarm-clock',
    style: 'cartoon-realiste',
    line: 2.6,
    limbs: '#7a5230',
    head,
    // A round belly, and hands that come up to its bells: the arms pass in front.
    arms: 'front',
    proportions: { thigh: 19, shin: 21, reach: 36, stride: 20, lift: 8, upper: 28, fore: 28 },
};
