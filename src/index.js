// Public entry point. Only what is exported here is part of the API.

export { createClock, driveWithAnimationFrame, advance } from './core/clock.js';
export { createFollower } from './core/spring.js';
export * as easing from './core/easing.js';
export { createStage } from './stage/stage.js';
export { createFigure } from './figure/figure.js';
export { createActor } from './actor/actor.js';
export { createFx } from './fx/fx.js';
export * as effects from './fx/effects.js';
export { createProp } from './props/prop.js';
export * as props from './props/library.js';
export { shapeHead } from './heads/shape-head.js';
export { emojiHead } from './heads/emoji-head.js';
export { stickman } from './characters/stickman.js';
export { readSpots, describeProblems, ATTRIBUTES } from './director/spots.js';
export { measureRoom, chooseVariant, moodAllows } from './director/room.js';
export { checkScene, checkScenes, playableBy, castOf, SCENE_FORMAT, SCENE_FIELDS } from './director/scene.js';
export { checkCharacter } from './director/cast.js';
export { createDirector } from './director/director.js';
export * as moves from './actor/moves.js';
export { start } from './start.js';
export { playComposition, checkComposition, compositionLength } from './director/composition.js';
export * as anatomy from './body/anatomy.js';
export { checkProp, checkProps } from './props/check.js';
