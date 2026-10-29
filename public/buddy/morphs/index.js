import { balloon } from "./balloon.js";
import { rocket } from "./rocket.js";
import { ball } from "./ball.js";
import { ghost } from "./ghost.js";
import { fish } from "./fish.js";
import { star } from "./star.js";

// Each morph is an object the buddy can turn into. Fields:
//   label     button text
//   outline   polygon in head units, or a function of time for shapes that move (ghost hem, fish tail).
//             Front toward +x for path-following morphs; upright ones can face any way.
//   scale     size while transformed; eyes { x, y, gap, size } where the eyes ride, in the object's own frame
//   duration  seconds of acting between the melt in and melt out
//   path      waypoints the object follows nose-first (it flips to face its direction, except inside `loop`)
//   motion    alternatively, (u, now) => { x, y, rot, sx, sy, ... } for its own movement; extra fields go to detail
//   events    [{ at: 0..1, symbol, from: "nose" }] symbols spawned during the act, at the object or its nose
//   nose      [x, y] where "nose" events come out
//   detail    (ctx, flight) draws extras over the shape in the object's frame
export const MORPHS = { balloon, rocket, ball, ghost, fish, star };
