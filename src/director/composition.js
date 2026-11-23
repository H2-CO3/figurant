// A scene: several characters on one floor, each doing things at given
// times. Where an animation is one character playing one thing, a scene is
// the score that puts them together. It is data: a cast, where each stands,
// and for each a track of clips with their start times, so that a page (or
// a person) can lay it out on a timeline.
//
//   {
//     title: 'Walking the dog',
//     style: 'default',                       // optional
//     width: 520,                             // floor it needs, in character units
//     cast: [{ id: 'owner', character: 'stickman', at: -160 }, { id: 'dog', character: 'dog', at: -90 }],
//           // a member may ride another: { id: 'sailor', character: 'stickman', on: 'boat', at: -30, up: 34 }
//           // stands `at` units from the middle of its carrier and `up` units above the floor, and goes where it goes
//     props: [{ prop: 'lounger', at: 150, behind: true }],          // optional scenery
//     ties: [{ from: 'owner:handR', to: 'dog:top' }],               // optional: a line between two points (a lead)
//     tracks: {
//       owner: [{ at: 0, walk: 60 }, { at: 4200, play: 'hello' }],
//       dog:   [{ at: 300, walk: 130 }, { at: 3000, move: 'hop' }],
//     },
//     loop: true,                             // optional: start again at the end
//   }
//
// A clip starts at `at` (milliseconds) and replaces whatever its character was
// doing. It does one thing:
//   walk: x            walks to x (character units from the middle of the floor); pace: optional
//   fly: 120  rises to that height above the floor and stays up for the clips that follow (fly: 0 comes down)
//   play: 'animation'  plays an animation made for that character; with: { ... } is handed to it as ctx.data
//   move: 'hop' | 'blink' | 'wave' | 'look-left' | 'look-right' | 'look-front' | 'turn'
//   set: { ... }, over: ms   animates numbers of its state (tilt, crouch, wide, its own ones…)
//   exit: 'left' | 'right'   walks off the floor

import { createFigure } from '../figure/figure.js';
import { createActor } from '../actor/actor.js';
import { createProp } from '../props/prop.js';
import { createRandom } from '../core/random.js';
import { blink, walkTo, hop, glance, recover } from '../actor/moves.js';
import { playableBy } from './scene.js';

const CLIPS = ['walk', 'play', 'move', 'set', 'exit', 'fly'];
const MOVES = ['hop', 'blink', 'wave', 'look-left', 'look-right', 'look-front', 'turn'];
const POINTS = ['handL', 'handR', 'top', 'centre'];

/**
 * Checks a scene against what the project has.
 * @returns {Array<{ composition, field, value, message, fix }>}
 */
export function checkComposition(name, composition, { characters = {}, animations = {}, props = {} } = {}) {
    const problems = [];
    const report = (field, value, message, fix) => problems.push({ composition: name, field, value, message, fix });
    if (!composition || typeof composition !== 'object') { report('', composition, 'is not an object.', 'A scene is { cast: [...], tracks: { id: [clips] } }.'); return problems; }
    const cast = Array.isArray(composition.cast) ? composition.cast : [];
    if (!cast.length) report('cast', composition.cast, 'has no cast.', 'List who is in it: cast: [{ id: "owner", character: "stickman", at: -100 }].');
    const ids = new Set();
    cast.forEach((member, i) => {
        if (typeof member?.id !== 'string' || !member.id) report(`cast[${i}].id`, member?.id, 'has a cast member with no id.', 'Give each one a short id; its track is named after it.');
        else if (ids.has(member.id)) report(`cast[${i}].id`, member.id, `has two cast members called "${member.id}".`, 'Give each its own id (two of the same character are fine: "guest-1", "guest-2").');
        ids.add(member?.id);
        if (!characters[member?.character]) report(`cast[${i}].character`, member?.character, `casts "${member?.character}", which the project does not have.`, `Use one of: ${Object.keys(characters).join(', ') || 'none yet'}.`);
        if (member?.on !== undefined && (member.on === member.id || !cast.some(other => other?.id === member.on && other.on === undefined))) report(`cast[${i}].on`, member.on, `puts "${member?.id}" on "${member.on}", who is not a cast member standing on the floor.`, 'Write on: the id of another cast member (who rides nobody), at: how far from its middle, up: how high above the floor.');
        if (!Number.isFinite(member?.at)) report(`cast[${i}].at`, member?.at, `does not say where "${member?.id}" stands.`, 'Give at: its place in character units from the middle of the floor (negative: to the left).');
    });
    (composition.props ?? []).forEach((item, i) => {
        if (!props[item?.prop]) report(`props[${i}].prop`, item?.prop, `uses the prop "${item?.prop}", which the project does not have.`, `Use one of: ${Object.keys(props).join(', ') || 'none yet'}.`);
    });
    (composition.ties ?? []).forEach((tie, i) => {
        for (const end of ['from', 'to']) {
            const [id, point] = String(tie?.[end] ?? '').split(':');
            if (!ids.has(id) || !POINTS.includes(point)) report(`ties[${i}].${end}`, tie?.[end], 'has a tie that does not name a point of a cast member.', `Write "<id>:<point>", the point being one of ${POINTS.join(', ')}.`);
        }
    });
    const tracks = composition.tracks && typeof composition.tracks === 'object' ? composition.tracks : {};
    for (const [id, clips] of Object.entries(tracks)) {
        if (!ids.has(id)) { report(`tracks.${id}`, id, `has a track for "${id}", who is not in the cast.`, `Tracks are named after cast ids: ${[...ids].join(', ')}.`); continue; }
        const character = cast.find(member => member.id === id)?.character;
        let last = -1;
        (Array.isArray(clips) ? clips : []).forEach((clip, i) => {
            const at = `tracks.${id}[${i}]`;
            if (!Number.isFinite(clip?.at) || clip.at < 0) report(`${at}.at`, clip?.at, 'has a clip with no start time.', 'Give at: when it starts, in milliseconds from the beginning.');
            else if (clip.at < last) report(`${at}.at`, clip.at, 'has clips out of order.', 'List the clips of a track in the order they start.');
            last = clip?.at ?? last;
            const does = CLIPS.filter(kind => clip?.[kind] !== undefined);
            if (cast.find(member => member.id === id)?.on !== undefined && (clip?.walk !== undefined || clip?.exit !== undefined || clip?.fly !== undefined)) report(at, clip, `makes "${id}" walk or fly, who rides "${cast.find(member => member.id === id).on}".`, 'A rider goes where its carrier goes: move the carrier, and give the rider play, move or set clips.');
            if (does.length !== 1) { report(at, clip, 'has a clip that does not do exactly one thing.', `A clip has one of: ${CLIPS.join(', ')}.`); return; }
            if (clip.play !== undefined) {
                if (!animations[clip.play]) report(`${at}.play`, clip.play, `plays "${clip.play}", which the project does not have.`, `Use one of: ${Object.keys(animations).join(', ') || 'none yet'}.`);
                else if (!playableBy(animations[clip.play], characters[character]?.name ?? character)) report(`${at}.play`, clip.play, `plays "${clip.play}", which was made for another character than "${character}".`, 'Use an animation of that character, or one any body can play.');
            }
            if (clip.move !== undefined && !MOVES.includes(clip.move)) report(`${at}.move`, clip.move, `has an unknown move "${clip.move}".`, `Use one of: ${MOVES.join(', ')}.`);
            if (clip.walk !== undefined && !Number.isFinite(clip.walk)) report(`${at}.walk`, clip.walk, 'has a walk with no destination.', 'Give walk: where to, in character units from the middle of the floor.');
            if (clip.exit !== undefined && !['left', 'right'].includes(clip.exit)) report(`${at}.exit`, clip.exit, 'has an exit that is not a side.', 'Write exit: "left" or "right".');
            if (clip.fly !== undefined && (!Number.isFinite(clip.fly) || clip.fly < 0)) report(`${at}.fly`, clip.fly, 'has a "fly" that is not a height.', 'Write fly: 120 (character units above the floor; 0 comes back down), over: 1200.');
            if (clip.set !== undefined && (!clip.set || typeof clip.set !== 'object')) report(`${at}.set`, clip.set, 'has a "set" that is not a list of numbers.', 'Write set: { tilt: 8 }, over: 400.');
        });
    }
    return problems;
}

/** When the last clip of a scene starts, and a guess at when the scene is over. */
export function compositionLength(composition) {
    const starts = Object.values(composition.tracks ?? {}).flatMap(clips => clips.map(clip => clip.at));
    return composition.length ?? (starts.length ? Math.max(...starts) + 4000 : 0);
}

/**
 * Plays a scene.
 * @param {object} options
 * @param {object} options.stage, options.clock
 * @param {object} options.composition
 * @param {object} options.characters { name: character }
 * @param {object} [options.animations] { name: animation }
 * @param {object} [options.props] { name: prop description }
 * @param {() => [number, number]} options.origin the middle of the floor, in page pixels
 * @param {number} [options.unit] pixels per character unit
 * @param {object} [options.fx] effects, handed to animations
 * @returns {{ actors: object, time: () => number, stop: () => void }}
 */
export function playComposition({ stage, clock, composition, characters, animations = {}, props = {}, origin, unit = 1, fx = null, seed = 1 }) {
    const random = createRandom(seed);
    const width = (composition.width ?? 600) * unit;
    const actors = {};
    const stops = [];
    let started = clock.now, running = true;

    // Scenery first: it stands behind the cast.
    const scenery = (composition.props ?? []).filter(item => props[item.prop]).map(item => {
        const description = props[item.prop];
        const layers = (description.layers || [description]).map(layer => createProp({ stage, prop: { points: description.points, ...layer }, unit, line: 2.6 }));
        for (const layer of layers) Object.assign(layer.state, { x: item.at * unit, flip: item.flip ?? 1 });
        return layers;
    }).flat();

    for (const member of composition.cast) {
        const character = characters[member.character];
        if (!character) continue;
        const figure = createFigure({ stage, character, unit });
        Object.assign(figure.state, { legs: 1, arms: 1, shadow: 1, scale: member.scale ?? 1, dir: member.dir ?? 1 });
        figure.state.x = member.at * unit;
        figure.state.y = -figure.standHeight();
        if (member.state) Object.assign(figure.state, member.state);
        const actor = createActor({ figure, clock, anchor: origin }).show();
        // `shift`: how far from the middle of the floor its animations are measured from (see perform).
        actors[member.id] = { actor, figure, member, shift: 0 };
    }

    // Ties: a line between two points, redrawn every frame (a lead, a rope).
    const ties = (composition.ties ?? []).map(tie => ({ tie, line: stage.el('path', stage.layer('tie'), { fill: 'none', stroke: tie.colour ?? 'var(--fig-ink, currentColor)', 'stroke-width': (tie.width ?? 1.4) * unit, 'stroke-linecap': 'round' }) }));
    const pointOf = end => {
        const [id, point] = end.split(':'), figure = actors[id]?.figure;
        if (!figure) return null;
        if (point === 'top') return figure.points.top;
        if (point === 'centre') return figure.points.centre;
        return figure.points[point === 'handL' ? 'armL' : 'armR']?.tip ?? figure.points.centre;
    };
    // Riders: each stands on its carrier and goes where it goes (leaning with it).
    const riders = Object.values(actors).filter(entry => entry.member.on !== undefined && actors[entry.member.on]);
    const ride = () => {
        for (const { figure, member } of riders) {
            const carrier = actors[member.on].figure, c = { ...carrier.state, x: carrier.state.x + actors[member.on].shift };
            // A carrier that moves on the spot says so: `heave` (units, down) and `roll` (degrees).
            const lean = ((c.tilt || 0) + (c.roll || 0)) * Math.PI / 180, up = (member.up ?? 0) * unit - (c.heave || 0) * carrier.k, along = member.at * unit * (c.dir || 1);
            figure.state.x = c.x + along * Math.cos(lean) + up * Math.sin(lean);
            figure.state.y = c.y + carrier.standHeight() - figure.standHeight() - up * Math.cos(lean) + along * Math.sin(lean);
            figure.state.shadow = 0;
        }
    };
    ride();
    stops.push(clock.onFrame(() => {
        ride();
        const at = origin();
        for (const layer of scenery) layer.render(at);
        for (const { tie, line } of ties) {
            const a = pointOf(tie.from), b = pointOf(tie.to);
            if (!a || !b) { line.setAttribute('d', ''); continue; }
            const sag = (tie.slack ?? 0.12) * Math.hypot(b[0] - a[0], b[1] - a[1]);
            line.setAttribute('d', `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2 + sag).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
        }
    }));

    /** What an animation is told about where it plays: a floor as wide as the scene. */
    const contextFor = (entry, clip) => {
        const here = (entry.figure.state.x + entry.shift) / unit, half = (composition.width ?? 600) / 2;
        const o = () => origin();
        return {
            place: { at: 0.5, name: 'scene', enter: 'none', scene: null, on: 'view', mood: 'free', cast: entry.member.id, sit: false, element: { getBoundingClientRect: () => ({ left: o()[0] - width / 2, right: o()[0] + width / 2, top: o()[1], bottom: o()[1] + 1, width, height: 1 }) } },
            room: { left: half + here, right: half - here, up: 400 },
            variant: 'full', scene: null,
            // What the clip passes to the animation (a word on a placard, say).
            data: clip.with ?? {},
            api: { actor: entry.actor, figure: entry.figure, state: entry.figure.state, random, pointer: { at: null }, pointerDistance: () => Infinity, view: () => ({ left: -width / 2, right: width / 2, top: -400 * unit, bottom: 40 * unit, toLocal: (x, y) => [x - o()[0], y - o()[1]] }), stage, clock, fx, noHover: false, moves: { blink, walkTo, hop, glance, recover } },
        };
    };

    /**
     * Where a character's positions are measured from: the middle of the floor
     * (0), or a point `shift` pixels from it. Nothing moves on screen.
     */
    const measureFrom = (entry, shift) => {
        if (entry.shift === shift) return;
        entry.shift = shift;
        // (The new point is fixed here: the actor compares it with the one it had, to keep the figure still.)
        entry.actor.reanchor(() => { const at = origin(); return [at[0] + shift, at[1]]; });
    };

    const perform = (entry, clip) => async c => {
        // Where it stands: on the floor, or as high above it as it was last told to fly.
        const s = c.state, k = entry.figure.k, standY = -entry.figure.standHeight() - (entry.height ?? 0) * unit;
        // A rider is not on the floor: it keeps the height its carrier gives it.
        await recover(c, entry.member.on !== undefined && actors[entry.member.on] ? s.y : standY, 160);
        const rider = entry.member.on !== undefined && !!actors[entry.member.on];
        // An animation is written around the spot where its character stands when it starts:
        // its steps, its props. So it is played from there; everything else a scene says
        // (walk to, leave by) is measured from the middle of the floor.
        if (!rider) measureFrom(entry, clip.play !== undefined ? entry.shift + s.x : 0);
        if (clip.walk !== undefined) await walkTo(c, clip.walk * unit, clip.pace ?? 1);
        else if (clip.exit !== undefined) await walkTo(c, (clip.exit === 'left' ? -1 : 1) * (width / 2 + 120 * k), clip.pace ?? 1);
        else if (clip.set !== undefined) await c.tween(clip.set, clip.over ?? 400);
        else if (clip.fly !== undefined) {
            // Up it goes (or down), and there it stays for the clips that follow.
            entry.height = clip.fly;
            await c.tween({ y: -entry.figure.standHeight() - clip.fly * unit }, clip.over ?? 1200);
        }
        else if (clip.move !== undefined) {
            if (clip.move === 'hop') await hop(c, 24);
            else if (clip.move === 'blink') await blink(c);
            else if (clip.move === 'wave') { await c.tween({ wave: 1 }, 220); await c.wait(clip.over ?? 900); await c.tween({ wave: 0 }, 220); }
            else if (clip.move === 'turn') { s.dir = -s.dir; await c.tween({ gazeX: s.dir }, 200); }
            else await glance(c, clip.move === 'look-left' ? -1 : clip.move === 'look-right' ? 1 : 0, 0, clip.over ?? 600);
        } else if (clip.play !== undefined) {
            const animation = animations[clip.play];
            if (animation && playableBy(animation, entry.figure.name)) await animation.play(c, contextFor(entry, clip));
        }
    };

    // Each track: at each clip's time, its character drops what it was doing and starts the clip.
    const schedule = () => {
        started = clock.now;
        for (const [id, clips] of Object.entries(composition.tracks ?? {})) {
            const entry = actors[id];
            if (!entry) continue;
            (async () => {
                const mine = started;
                for (const clip of clips) {
                    await clock.wait(Math.max(0, clip.at - (clock.now - mine)));
                    if (!running || mine !== started) return;
                    entry.actor.play(perform(entry, clip)).catch(() => {});
                }
            })();
        }
        if (composition.loop) clock.wait(compositionLength(composition)).then(() => { if (running) { reset(); schedule(); } });
    };
    const reset = () => {
        for (const entry of Object.values(actors)) {
            const { actor, figure, member } = entry;
            entry.height = 0;
            measureFrom(entry, 0);
            actor.play(async c => { await recover(c, -figure.standHeight(), 1); }).catch(() => {});
            Object.assign(figure.state, { x: member.at * unit, dir: member.dir ?? 1, tilt: 0 }, member.state);
        }
        ride();
        {
        }
    };
    schedule();

    return {
        actors,
        /** Milliseconds since the scene (or its current loop) began. */
        time: () => clock.now - started,
        stop() {
            running = false;
            for (const stop of stops) stop();
            for (const { actor } of Object.values(actors)) actor.destroy();
            for (const layer of scenery) layer.destroy();
            for (const { line } of ties) line.parentNode?.remove?.() ?? line.remove?.();
        },
    };
}
