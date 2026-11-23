// The director: makes characters live on a real page. It reads the page
// markers, decides where each character should be as the visitor scrolls,
// brings it there, and plays the scene tied to the place when the moment and
// the room are right.
//
// What is generic lives here. What belongs to one character on one site (how
// it is born from a logo, a hide-and-seek game on its home) plugs in through a
// `home` controller.

import { clamp, easeIn, easeOut, easeInBack, linear } from '../core/easing.js';
import { createRandom } from '../core/random.js';
import { createFigure } from '../figure/figure.js';
import { createActor } from '../actor/actor.js';
import { blink, walkTo, land, hop, glance, sitOnEdge, recover } from '../actor/moves.js';
import { readSpots } from './spots.js';
import { measureRoom, chooseVariant, moodAllows } from './room.js';
import { checkScenes, playableBy, castOf } from './scene.js';
import { checkCharacter } from './cast.js';

const DEBOUNCE = 140;        // ms a scroll position must hold before a move starts
const QUIET = 1800;          // ms without pointer movement before it plays on its own
const STARTLE_RADIUS = 70;   // px: a pointer this close makes it jump
const POKE_RADIUS = 60;      // px: a click or tap this close makes it leap and wave
const RESUME_RADIUS = 150;   // px: a pointer further than this lets an interrupted on-view scene start again
const ATTEND_RADIUS = 300;   // px: a pointer moving this close pulls it out of an idle scene
const OFFSTAGE = 110;        // character units beyond the edge when it walks off

/**
 * @param {object} options
 * @param {object} options.stage
 * @param {object} options.clock
 * @param {object} options.cast   { name: { character, unit?, scale?, home? } }
 *        unit: pixels per character unit, a number or a function (re-read every
 *        frame, for a size that follows the layout). scale: its size while
 *        roaming the page. The cast named `default` gets the spots that name
 *        no cast.
 *        state: values its figure starts from (an eye already open, say).
 *        home: a controller for a character born from a page element (the one
 *        marked data-fig-home). All members are optional:
 *          anchor(element)        -> anchor function for the home place
 *          begin(api, { atHome }) -> may return a promise; the character is
 *                                    held until it resolves
 *          enter(c, api, down)    -> sequence played when it comes back home
 *          leave(c, api, down)    -> sequence played before it leaves home
 *          frame(dt, api)         -> called every frame while it is at home
 *          visible(rect, win, clearance) -> is the home on screen?
 *          resting(api)           -> true when it may skip drawing off screen
 *          wanted(api)            -> true: the home is where it should be
 *                                    now; false: anywhere but home;
 *                                    undefined: nearest place wins
 *          wander(api)            -> [gazeX, gazeY] for an idle glance
 * @param {object} [options.scenes] { name: { play(c, ctx), room?, variants?, mood? } }
 * @param {object} [options.fx] from createFx(); handed to scenes as `api.fx`
 * @param {number | (() => number)} [options.clearance] px kept free at the top (a fixed
 *        navbar); a function is read again each time, for a header that changes height
 * @param {number} [options.seed]
 * @param {Window} [options.win]
 * @param {Document} [options.doc]
 * @param {ParentNode} [options.root] where to look for markers
 */
export function createDirector({
    stage, clock, cast, scenes = {}, fx = null, clearance = 0, seed = 1,
    win = globalThis.window, doc = globalThis.document, root = doc,
}) {
    const random = createRandom(seed);
    const clear = () => (typeof clearance === 'function' ? Number(clearance()) || 0 : clearance);
    const reduced = !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const noHover = !!win.matchMedia?.('(hover: none)').matches;
    const marks = readSpots(root, { scenes: Object.keys(scenes), casts: Object.keys(cast) });

    // One pointer for the whole page, in viewport pixels.
    const pointer = { at: null, moved: false, lastMove: -1e9 };
    let scrollDirty = true;
    const hovered = new Set();
    const listeners = [];
    const listen = (target, type, fn) => {
        target.addEventListener(type, fn, { passive: true });
        listeners.push(() => target.removeEventListener(type, fn));
    };

    const members = [];
    let stopFrame = null;

    const viewport = () => ({
        left: win.scrollX, top: win.scrollY,
        right: win.scrollX + doc.documentElement.clientWidth,
        bottom: win.scrollY + win.innerHeight,
    });

    function createMember(name, definition) {
        const unitOf = typeof definition.unit === 'function' ? definition.unit : () => definition.unit ?? 1;
        const roam = definition.scale ?? 0.6;
        const home = marks.homes.find(h => h.cast === name);
        const controller = definition.home || null;
        const places = marks.spots.filter(spot => spot.cast === name).map(spot => ({
            ...spot,
            solemn: spot.mood === 'solemn',
            anchor: stage.on(spot.element, spot.at, 0),
            // Places with a scene that waits for the visitor are not stops on
            // the scroll route: the character goes there when asked.
            onDemand: !!spot.scene && (spot.on === 'attention' || spot.on === 'click'),
        }));
        if (home) {
            places.unshift({
                home: true, name: `${name}:home`, element: home.element, solemn: false, onDemand: false,
                anchor: controller?.anchor ? controller.anchor(home.element) : stage.on(home.element, 0.5, 0),
            });
        }
        if (!places.length) return null;

        const figure = createFigure({ stage, character: definition.character, unit: unitOf() });
        const actor = createActor({ figure, clock, anchor: stage.view() });
        const s = figure.state;
        Object.assign(s, definition.state);

        const m = {
            name, figure, actor, places,
            mode: 'off',       // off | acting | perched | home
            tracking: false,   // do the eyes follow the pointer?
            busy: false,       // is a place scene playing?
            current: -1,       // place it is at, or heading to
            target: -1,        // place the page asks for
            placed: false,     // standing somewhere, or in the wings?
            standY: null,      // y at which it stands on the current place
        };
        let pending = -1, pendingSince = 0;
        let traveling = false, lastDown = true;
        let nextBlink = Infinity, nextStartle = 0, nextGlance = 0, look = [0, 0];
        let idleAt = Infinity, idleCount = 0, sceneKind = null, sceneSpot = -1, cutShort = false;
        let asked = -1; // on-demand place the visitor is asking for
        let directions = 0; // how many times a choreography took it

        /** The visible page, in pixels from the current anchor. */
        const view = () => {
            const o = actor.anchor(), v = viewport();
            return {
                left: v.left - o[0], top: v.top - o[1], right: v.right - o[0], bottom: v.bottom - o[1],
                toLocal: (px, py) => [v.left - o[0] + px, v.top - o[1] + py],
            };
        };
        const pointerDistance = () => {
            if (!pointer.at) return Infinity;
            const p = view().toLocal(pointer.at[0], pointer.at[1]);
            return Math.hypot(p[0] - s.x, p[1] - s.y);
        };
        const onScreen = () => {
            const v = view(), margin = 100;
            return s.x > v.left - margin && s.x < v.right + margin && s.y > v.top - margin && s.y < v.bottom + margin;
        };
        const play = sequence => {
            m.busy = false;
            sceneKind = null;
            return actor.play(sequence).catch(error => { console.warn(`[figurant] ${name}:`, error); return 'failed'; });
        };
        const until = async (c, condition) => { while (!condition()) await c.wait(80); };

        const api = {
            member: m, actor, figure, state: s, view, pointerDistance, onScreen, play, until, random,
            pointer, noHover, stage, clock, fx,
            moves: { blink, walkTo, land, hop, glance, sitOnEdge, recover },
            setMode(mode, { tracking = m.tracking } = {}) { m.mode = mode; m.tracking = tracking; },
            scheduleBlink(ms) { nextBlink = s.clock + ms; },
        };
        m.api = api;

        // ---------- Which place does the page ask for? ----------

        const placeVisible = i => {
            const place = places[i];
            const r = place.element.getBoundingClientRect();
            if (place.home && controller?.visible) return controller.visible(r, win, clear());
            const tall = figure.standHeight() / s.scale * roam;
            return r.top - tall > clear() && r.top < win.innerHeight - 20;
        };

        const pickTarget = () => {
            // The home controller may decide for its place: true, it is the
            // target; false, it is not a candidate; anything else, by distance.
            const homeWanted = home ? controller?.wanted?.(api) : undefined;
            if (homeWanted === true) return 0;
            if (asked >= 0 && placeVisible(asked)) return asked;
            const mid = win.innerHeight * 0.5;
            let best = -1, bestDistance = Infinity;
            places.forEach((place, i) => {
                if (place.onDemand || (place.home && homeWanted === false)) return;
                const r = place.element.getBoundingClientRect();
                const y = place.home ? r.top + r.height / 2 : r.top;
                const d = Math.abs(y - mid);
                if (d < bestDistance) { bestDistance = d; best = i; }
            });
            return best;
        };

        // ---------- Travelling between places ----------

        const ready = async c => {
            m.mode = 'acting';
            m.tracking = false;
            await recover(c, m.standY, 240);
            await c.tween({ gazeX: 0, gazeY: 0, rope: 0, breath: 0 }, 80);
        };

        /** Leaves where it is: a dive downwards, or hoisted up by a thread. */
        const exit = async (c, down) => {
            const visible = onScreen();
            const solemn = m.standY !== null && places[m.current]?.solemn;
            m.standY = null;
            idleAt = Infinity;
            s.shadow = 0;
            const k = figure.k;
            if (visible && solemn) {
                // Heavy content: it walks away, no number.
                const v = view();
                await walkTo(c, v.right - s.x < s.x - v.left ? v.right + OFFSTAGE * k : v.left - OFFSTAGE * k, 0.8);
            }
            actor.reanchor(stage.view());
            if (!visible || solemn) { s.y = view().top - 400; return; }

            if (down) {
                await c.tween({ crouch: 7, squash: 0.4, gazeY: 1 }, 110, easeOut);
                c.also({ crouch: 0, squash: -0.25 }, 120, easeOut);
                await c.tween({ stretch: 1, y: s.y - 20 * k }, 170, easeOut);
                c.also({ squash: -0.5 }, 300, easeIn);
                await c.tween({ y: view().bottom + 140 * k }, 380, easeIn);
            } else {
                await c.tween({ rope: 1, gazeY: -1 }, 200, easeOut);
                await c.tween({ stretch: 1, wide: 0.8, squash: 0.25 }, 120, easeOut);
                c.also({ squash: -0.45 }, 200, easeOut);
                await c.tween({ y: view().top - 170 * k }, 420, easeInBack);
                s.rope = 0;
            }
            s.squash = 0;
            if ('wide' in s) s.wide = 0;
        };

        /** Arrives on a place: from above when going down the page, from below otherwise. */
        const enter = async (c, index, down) => {
            const place = places[index];
            actor.anchor = place.anchor;
            Object.assign(s, { tilt: 0, rope: 0, crouch: 0, squash: 0, sit: 0, seat: 0 });

            if (place.home && controller?.enter) {
                m.mode = 'home';
                await controller.enter(c, api, down);
                return;
            }

            s.scale = roam;
            const k = figure.k;
            const floor = -figure.standHeight(); // standing on the element's top edge
            const kind = place.enter === 'none' ? 'none'
                : place.solemn ? 'walk' : (!down && place.enter !== 'walk' ? 'leap' : place.enter || 'walk');
            const v = view();
            Object.assign(s, { x: 0, floor: 0, shadow: 1, legs: 1, arms: 1 });

            if (kind === 'none') {
                // No entrance: it is simply standing there.
                s.stretch = 0;
                s.y = floor;
            } else if (kind === 'walk') {
                s.stretch = 0;
                s.y = floor;
                s.x = v.right < -v.left ? v.right + OFFSTAGE * k : v.left - OFFSTAGE * k;
                await walkTo(c, 0, place.solemn ? 0.8 : 1);
                c.also({ gazeX: 0 }, 200);
            } else if (kind === 'rope') {
                Object.assign(s, { y: v.top - 120 * k, rope: 1, stretch: 1, gazeY: 0.8, squash: -0.2 });
                await c.tween({ y: floor }, 950, easeOut);
                await land(c, 6);
                await c.tween({ rope: 0 }, 220, easeIn);
            } else if (kind === 'leap') {
                Object.assign(s, { x: -50 * k, y: v.bottom + 110 * k, stretch: 1, gazeY: -0.8, squash: -0.45 });
                clock.tween(s, { x: 0 }, 600, linear);
                c.also({ squash: 0 }, 400, easeOut);
                await c.tween({ y: floor - 46 * k }, 400, easeOut);
                c.also({ squash: -0.25, gazeY: 0.8 }, 200, easeIn);
                await c.tween({ y: floor }, 200, easeIn);
                await land(c, 10);
            } else { // drop
                Object.assign(s, { y: v.top - 120 * k, stretch: 1, gazeY: 0.8, squash: -0.5 });
                c.also({ wide: 0.6 }, 1);
                await c.tween({ y: floor }, 430, easeIn);
                await land(c, 14);
            }

            m.standY = floor;
            perch(place.solemn ? 700 : 2600);
            idleCount = 0;
            c.also({ breath: 1 }, 800);
            nextStartle = s.clock + 1500;
        };

        /** Between two places side by side on screen: it simply walks over. */
        const stroll = async (c, to) => {
            const place = places[to];
            await ready(c);
            m.standY = -figure.standHeight();
            actor.reanchor(place.anchor);
            await walkTo(c, 0);
            s.y = m.standY;
            perch(400);
        };

        const sameLedge = (a, b) => {
            if (a < 0 || b < 0 || places[a].home || places[b].home || places[a].solemn || places[b].solemn) return false;
            const ra = places[a].element.getBoundingClientRect(), rb = places[b].element.getBoundingClientRect();
            return Math.abs(ra.top - rb.top) < 2;
        };

        const travel = async c => {
            try {
                while (m.target !== m.current || !m.placed) {
                    const to = m.target;
                    if (m.placed && m.standY !== null && sameLedge(m.current, to) && onScreen()) {
                        m.current = to;
                        await stroll(c, to);
                        continue;
                    }
                    const down = to === m.current ? lastDown : to > m.current;
                    if (m.placed) {
                        if (places[m.current]?.home && controller?.leave) await controller.leave(c, api, down);
                        await ready(c);
                        await exit(c, down);
                        m.placed = false;
                        // In the wings: well out of sight, whatever its size.
                        s.y = view().top - 400;
                    }
                    m.current = to;
                    lastDown = down;
                    // In the wings until the place is on screen.
                    await until(c, () => m.target !== to || placeVisible(to));
                    if (m.target !== to) continue;
                    await enter(c, to, down);
                    m.placed = true;
                }
            } finally {
                traveling = false;
            }
        };

        // ---------- At a place ----------

        function perch(idleIn = 3500 + random() * 2500) {
            m.mode = 'perched';
            m.tracking = true;
            idleAt = s.clock + idleIn;
            nextBlink = s.clock + 600 + random() * 900;
        }

        const startle = async c => {
            m.mode = 'acting';
            c.also({ pupil: 0.6, wide: 1 }, 80, easeOut);
            await recover(c, m.standY, 110);
            const y = s.y;
            c.also({ squash: -0.3 }, 120, easeOut);
            await c.tween({ y: y - 16 * figure.k, stretch: 0.6 }, 130, easeOut);
            await c.tween({ y }, 150, easeIn);
            await land(c, 6);
            c.also({ pupil: 1 }, 300);
            nextStartle = s.clock + 4000;
            perch();
        };

        const poked = async c => {
            m.mode = 'acting';
            c.also({ pupil: 0.6, wide: 1 }, 80, easeOut);
            await recover(c, m.standY, 100);
            await hop(c, 34);
            c.also({ pupil: 1, squint: 0.5 }, 250);
            await c.tween({ wave: 1, gazeX: 0, gazeY: 0 }, 220, easeOut);
            await c.wait(800);
            c.also({ squint: 0 }, 250);
            await c.tween({ wave: 0 }, 220);
            nextStartle = s.clock + 3000;
            perch();
        };

        const attend = async c => {
            await recover(c, m.standY);
            perch();
        };

        // Stock scenes, used when a place has none of its own.
        const stock = {
            async look(c) {
                await glance(c, -0.6, 0.9, 900);
                await glance(c, 0.5, 1, 1100);
                await glance(c, 0, 0, 300);
            },
            async rest(c) {
                await sitOnEdge(c, m.standY);
                for (let i = 0; i < 4; i++) {
                    await glance(c, (random() * 2 - 1) * 0.8, random() * 0.9, 900 + random() * 900);
                }
                await c.tween({ lid: 0.45, gazeX: 0, gazeY: 0.5 }, 900);
                await c.wait(500);
                await c.tween({ lid: 0.85 }, 160, easeOut);
                await c.wait(400);
                await c.tween({ lid: 0.12, gazeY: 0.8, tilt: 7 }, 1400);
                await until(c, () => false); // until something disturbs it
            },
            async solemn(c) {
                c.also({ breath: 0.5 }, 600);
                await c.tween({ gazeX: 0, gazeY: 1, lid: 0.74, tilt: 4, crouch: 3 }, 1100);
                await until(c, () => false);
            },
        };

        /** The scene of a place, sized to the room there is right now; or null. */
        const sceneFor = place => {
            const scene = place.scene && scenes[place.scene];
            if (!scene || !moodAllows(scene, place.mood) || !playableBy(scene, figure.name)) return null;
            const o = actor.anchor();
            const v = viewport();
            const room = measureRoom({
                point: [o[0] + s.x, o[1] + (m.standY ?? s.y) + figure.standHeight()],
                bounds: { left: v.left + 8, right: v.right - 8, top: v.top + clear(), bottom: v.bottom },
                k: figure.k,
            });
            const fit = chooseVariant({ name: place.scene, ...scene }, room);
            return fit && { scene, fit, room };
        };

        const runScene = (place, kind) => async c => {
            const chosen = sceneFor(place);
            if (!chosen) { perch(4000); return; }
            m.busy = true;
            m.tracking = false;
            sceneKind = kind;
            sceneSpot = m.current;
            // Until it reaches its end, a scene played on view is owed to the visitor.
            cutShort = kind === 'view';
            await chosen.scene.play(c, { place, variant: chosen.fit.name, scene: chosen.fit.scene, room: chosen.room, api });
            await recover(c, m.standY);
            cutShort = false;
            m.busy = false;
            sceneKind = null;
            if (kind === 'click') { asked = -1; scrollDirty = true; }
            perch();
        };

        const idle = async c => {
            const place = places[m.current];
            const own = place.scene && place.on === 'idle' && sceneFor(place);
            const turn = idleCount++;
            if (place.solemn) { m.busy = true; m.tracking = false; await stock.solemn(c); return; }
            if (turn % 2 === 1 && place.sit && definition.character.sits !== false) { m.busy = true; m.tracking = false; sceneKind = 'idle'; await stock.rest(c); return; }
            if (own) return runScene(place, 'idle')(c);
            m.busy = true; m.tracking = false; sceneKind = 'idle';
            await stock.look(c);
            m.busy = false;
            perch();
        };

        // The visitor's attention on an on-demand place.
        const wants = i => {
            const place = places[i];
            if (place.on !== 'attention') return false;
            if (!noHover) return hovered.has(place.element);
            const r = place.element.getBoundingClientRect();
            const centre = r.top + r.height / 2;
            return centre > win.innerHeight * 0.3 && centre < win.innerHeight * 0.7;
        };

        places.forEach((place, i) => {
            if (!place.scene) return;
            if (place.on === 'attention') {
                listen(place.element, 'pointerenter', () => { hovered.add(place.element); scrollDirty = true; });
                listen(place.element, 'pointerleave', () => { hovered.delete(place.element); scrollDirty = true; });
            } else if (place.on === 'click') {
                listen(place.element, 'click', () => {
                    asked = i; scrollDirty = true;
                    if (m.mode === 'perched' && m.current === i) play(runScene(place, 'click'));
                });
            }
        });

        m.poke = () => {
            if (m.mode === 'perched' && !places[m.current].solemn && pointerDistance() < POKE_RADIUS) play(poked);
        };

        /**
         * Hands the character to a choreography: `sequence(c, api)` plays on
         * it and, meanwhile, the page leaves it alone (no travel, no scene, no
         * reaction to the pointer). Its position is then measured from the
         * screen's top-left corner, so several characters share one space.
         * When the sequence ends, or after release(), it tidies itself and
         * goes back to the place the page asks for.
         * @returns {Promise<'done'|'cancelled'|'failed'>}
         */
        m.direct = sequence => {
            const turn = ++directions;
            m.directed = true;
            m.mode = 'acting';
            m.tracking = false;
            idleAt = Infinity;
            return play(async c => {
                actor.reanchor(stage.view());
                s.shadow = 0;
                await sequence(c, api);
            }).finally(() => {
                if (turn !== directions) return; // taken again meanwhile
                m.directed = false;
                // As if it stood on no place: the trip back starts with an exit.
                m.placed = true;
                m.current = -1;
                m.standY = null;
                traveling = false;
            });
        };
        /** Takes the character back from a choreography, at once. */
        m.release = () => { if (m.directed) actor.cancel(); };

        m.begin = () => {
            figure.unit = unitOf();
            // Until it enters its first place, it waits out of sight, above the page.
            s.y = view().top - 400;
            m.target = pending = pickTarget();
            if (home && controller) {
                // A character with a home controller is born at home, whatever
                // the scroll position, and is held until the controller is ready
                // (for instance until a logo has finished drawing itself).
                m.current = 0;
                m.placed = true;
                m.mode = 'home';
                actor.anchor = places[0].anchor;
                m.held = true;
                Promise.resolve(controller.begin?.(api, { atHome: m.target === 0 })).then(() => {
                    m.held = false;
                    scrollDirty = true;
                });
            }
        };

        m.frame = dt => {
            if (m.held) return;
            figure.unit = unitOf();
            if (pointer.moved) pointer.lastMove = s.clock;

            // Which on-demand place, if any, is the visitor asking for?
            if (scrollDirty || noHover) {
                let now = -1;
                places.forEach((place, i) => { if (place.onDemand && place.on === 'attention' && wants(i)) now = i; });
                if (now >= 0) asked = now;
                else if (places[asked]?.on !== 'click') asked = -1;
            }
            if (scrollDirty) {
                const picked = pickTarget();
                if (picked !== pending) { pending = picked; pendingSince = s.clock; }
            }
            if (pending !== m.target && s.clock - pendingSince > DEBOUNCE) m.target = pending;
            if (m.directed) { actor.draw(dt); return; }
            if (!traveling && m.target >= 0 && (m.target !== m.current || !m.placed)) {
                traveling = true;
                m.mode = 'acting';
                play(travel);
            }

            if (m.mode === 'home') controller?.frame?.(dt, api);

            // Standing still off screen: nothing to draw, save the frame.
            const still = m.mode === 'perched' || m.mode === 'off' || (m.mode === 'home' && (controller?.resting?.(api) ?? true));
            if (!traveling && !m.busy && still && (m.mode === 'off' || !onScreen())) {
                s.clock += dt;
                return;
            }

            const v = view();
            s.ropeTop = v.top - 20;
            const at = pointer.at ? v.toLocal(pointer.at[0], pointer.at[1]) : null;
            const px = at ? Math.hypot(at[0] - s.x, at[1] - s.y) : Infinity;
            const quiet = !pointer.at || s.clock - pointer.lastMove > QUIET;

            if (m.tracking) {
                let gx, gy, follow;
                if (at && !quiet) {
                    gx = clamp((at[0] - s.x) / 260, -1, 1);
                    gy = clamp((at[1] - s.y) / 260, -1, 1);
                    follow = Math.min(1, dt * 0.012);
                } else {
                    // Nobody to follow: its eyes wander in small jumps, mostly towards the content.
                    if (s.clock > nextGlance) {
                        nextGlance = s.clock + 900 + random() * 2200;
                        look = controller?.wander?.(api) ?? [random() * 1.8 - 0.9, random() * 1.1 - 0.15];
                        if (random() < 0.3) nextBlink = s.clock;
                    }
                    [gx, gy] = look;
                    follow = Math.min(1, dt * 0.03);
                }
                if ('gazeX' in s) {
                    s.gazeX += (gx - s.gazeX) * follow;
                    s.gazeY += (gy - s.gazeY) * follow;
                }
                if (m.mode === 'perched' && 'pupil' in s) {
                    const interest = clamp(1 - px / 260, 0, 1);
                    s.pupil += (1 + 0.22 * interest - s.pupil) * Math.min(1, dt * 0.006);
                }
                if (s.clock > nextBlink && 'lid' in s) {
                    nextBlink = s.clock + 2200 + random() * 3500;
                    clock.tween(s, { lid: 0 }, 70, easeIn).then(() => { if (s.lid < 0.01) clock.tween(s, { lid: 1 }, 110, easeOut); });
                }
            }

            if (m.mode === 'perched') {
                const place = places[m.current];
                const asking = place.onDemand && place.on === 'attention' && wants(m.current);
                if (sceneKind === 'attention' && !asking) play(attend);
                else if (!m.busy && asking) play(runScene(place, 'attention'));
                else if (px < STARTLE_RADIUS && s.clock > nextStartle && !place.solemn && sceneKind !== 'attention') play(startle);
                else if (m.busy && sceneKind === 'idle' && !quiet && px < ATTEND_RADIUS) play(attend);
                else if (!m.busy && place.scene && place.on === 'view' && (sceneSpot !== m.current || (cutShort && px > RESUME_RADIUS))) play(runScene(place, 'view'));
                else if (!m.busy && quiet && s.clock > idleAt) play(idle);
            }

            actor.draw(dt);
        };

        return m;
    }

    const director = {
        /** Mistakes in the page markers, the scenes and the characters, each with its fix. */
        problems: [
            ...marks.problems, ...checkScenes(scenes),
            ...Object.values(cast).flatMap(member => checkCharacter(member.character)),
            // A scene belongs to the character it was made for: another body would play it wrong.
            ...marks.spots.filter(spot => spot.scene && scenes[spot.scene] && cast[spot.cast] && castOf(scenes[spot.scene]).length
                && !playableBy(scenes[spot.scene], cast[spot.cast].character?.name)).map(spot => ({
                scene: spot.scene, field: 'character', value: scenes[spot.scene].character,
                message: `was made for ${castOf(scenes[spot.scene]).join(', ')}, but the place "${spot.name}" is played by ${cast[spot.cast].character?.name}: it will not play there.`,
                fix: `Adapt it: make a copy of the scene fitted to ${cast[spot.cast].character?.name} and name that copy in data-fig-scene.`,
            })),
        ],
        spots: marks.spots,
        members,
        /** True when the visitor asked for reduced motion: nothing will move. */
        reduced,

        start() {
            if (reduced || stopFrame) return director;
            for (const [name, definition] of Object.entries(cast)) {
                const member = createMember(name, definition);
                if (member) members.push(member);
            }
            listen(win, 'pointermove', e => { pointer.at = [e.clientX, e.clientY]; pointer.moved = true; });
            listen(win, 'pointerdown', e => {
                pointer.at = [e.clientX, e.clientY]; pointer.moved = true;
                for (const member of members) member.poke();
            });
            // A finger does not stay: forget it as soon as it lifts.
            const forget = e => { if (e.pointerType === 'touch') pointer.at = null; };
            listen(win, 'pointerup', forget);
            listen(win, 'pointercancel', forget);
            listen(win, 'scroll', () => { scrollDirty = true; });
            listen(win, 'resize', () => { scrollDirty = true; });

            for (const member of members) member.begin();
            stopFrame = clock.onFrame(dt => {
                for (const member of members) member.frame(dt);
                pointer.moved = false;
                scrollDirty = false;
            });
            return director;
        },

        stop() {
            if (stopFrame) stopFrame();
            stopFrame = null;
            while (listeners.length) listeners.pop()();
            for (const member of members.splice(0)) member.actor.destroy();
        },
    };

    return director;
}
