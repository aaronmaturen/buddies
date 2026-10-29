// Emotes are short one-off reactions layered on top of the current mood.
//   duration  seconds
//   mood      borrowed for the whole emote (any key of MOODS)
//   mouth     shape shown during the emote (any key of MOUTHS)
//   motion    head movement (any key of MOTIONS in emote-player.js)
//   events    things that happen at a time `at`, sorted by `at`:
//             { symbol } spawns a mark, { jump, squash } kicks the bounce springs,
//             { mood } switches the borrowed mood for the rest of the emote,
//             { hand: "right" | "left" | "both", pose, x, y, rot } brings in hands (see hands.js);
//               face: true pins y to the eye line and follows the head's turn,
//               wiggle { rot, freq }, bob { x, y, freq } and clap { x, freq } add rhythm,
//             { hand, hide: true } sends those hands away; a hand event's holds puts a prop in it (HELD in props.js),
//             { wear } puts on an accessory (WEARABLES in wear.js), { magnify: 1 | -1, zoom } enlarges one eye
export const EMOTES = {
  love: { duration: 1.8, mood: "happy", mouth: "smile", motion: "sway",
    events: [{ at: 0, jump: 2.2 }, { at: 0, symbol: "heart" }, { at: .25, symbol: "heart" }, { at: .5, symbol: "heart" }] },
  laugh: { duration: 1.6, mood: "happy", mouth: "grin", motion: "giggle",
    events: [{ at: 0, jump: 1.6 }, { at: .35, jump: 1.6 }, { at: .7, jump: 1.6 }] },
  surprise: { duration: 1.3, mood: "surprised", mouth: "o", motion: "recoil",
    events: [{ at: 0, symbol: "bang", jump: 3, squash: 4 }] },
  huh: { duration: 1.6, mood: "confused", mouth: "flat", motion: "tilt",
    events: [{ at: .1, symbol: "question" }] },
  mad: { duration: 1.6, mood: "angry", mouth: "frown", motion: "shake",
    events: [{ at: 0, symbol: "anger" }] },
  nervous: { duration: 1.8, mood: "worried", mouth: "wavy", motion: "tremble",
    events: [{ at: .1, symbol: "sweat" }] },
  snooze: { duration: 2.6, mood: "sleepy", mouth: "small", motion: "doze",
    events: [{ at: 0, wear: "nightcap" }, { at: .2, symbol: "z" }, { at: .9, symbol: "z" }, { at: 1.6, symbol: "z" }] },
  blush: { duration: 2, mood: "shy", mouth: "smile", motion: "lookAway",
    events: [{ at: 0, symbol: "blush", life: 2 }] },
  proud: { duration: 1.8, mood: "smug", mouth: "smile", motion: "chinUp",
    events: [{ at: .1, symbol: "sparkle" }, { at: .3, symbol: "sparkle" }, { at: .5, symbol: "sparkle" }, { at: .7, symbol: "sparkle" }] },
  silly: { duration: 1.6, mood: "happy", mouth: "tongue", motion: "wiggle" },
  yes: { duration: 1.1, mouth: "smile", motion: "nod" },
  no: { duration: 1.4, mouth: "flat", motion: "shake",
    events: [{ at: 0, hand: "right", pose: "point", x: 1.05, y: .05, rot: .1, wiggle: { rot: .35, freq: 3 } }] },

  // Hands
  wave: { duration: 2, mood: "happy", mouth: "smile", motion: "sway",
    events: [{ at: 0, hand: "right", pose: "open", x: 1.25, y: -.3, rot: .25, wiggle: { rot: .45, freq: 2.6 } }] },
  facepalm: { duration: 2.2, mood: "bored", mouth: "flat", motion: "sigh",
    events: [{ at: .1, hand: "right", pose: "open", x: .2, y: -.08, rot: -.3, size: 1.45, face: true }] },
  peekaboo: { duration: 2.6, mood: "shy", mouth: "smile",
    events: [
      { at: 0, hand: "both", pose: "open", x: .3, y: -.04, rot: .15, size: 1.15, face: true },
      { at: 1.3, hand: "both", pose: "open", x: .98, y: .05, rot: .55, mood: "excited", jump: 1.8 },
    ] },
  thumbsUp: { duration: 1.9, mood: "happy", mouth: "grin", motion: "chinUp",
    events: [{ at: 0, hand: "right", pose: "thumb", x: 1.15, y: .25, rot: -.1, bob: { y: .06, freq: 2.5 } }, { at: .2, symbol: "sparkle" }] },
  shrug: { duration: 1.9, mood: "confused", mouth: "flat", motion: "tilt",
    events: [{ at: 0, hand: "both", pose: "open", x: 1.3, y: .3, rot: 1.25, bob: { y: -.05, freq: 1.2 } }] },
  clap: { duration: 2, mood: "excited", mouth: "grin",
    events: [
      { at: 0, hand: "both", pose: "open", x: .12, y: .92, rot: -.5, clap: { x: .4, freq: 3.2 } },
      { at: .3, symbol: "sparkle" }, { at: .7, symbol: "sparkle" }, { at: 1.1, symbol: "sparkle" },
    ] },
  think: { duration: 2.4, mood: "thinking", mouth: "flat",
    events: [{ at: 0, hand: "right", pose: "point", x: .14, y: .55, rot: -.2, face: true }] },

  // Accessories
  cool: { duration: 2.2, mood: "smug", mouth: "smile", motion: "chinUp",
    events: [{ at: 0, wear: "sunglasses" }, { at: .5, symbol: "sparkle" }] },
  party: { duration: 2.4, mood: "excited", mouth: "grin",
    events: [
      { at: 0, wear: "partyHat", jump: 2.4, symbol: "confetti" },
      { at: .05, hand: "both", pose: "open", x: 1.15, y: -.55, rot: .35, wiggle: { rot: .2, freq: 3 } },
      { at: .8, symbol: "confetti", jump: 1.6 },
    ] },
  idea: { duration: 2.6, mood: "thinking", mouth: "flat",
    events: [
      { at: 0, symbol: "thought" },
      { at: 1.3, symbol: "bulb", mood: "excited", jump: 2.2 },
      { at: 1.35, hand: "right", pose: "point", x: 1.1, y: -.45, rot: .15 },
    ] },
  coffee: { duration: 3, mood: "sleepy", mouth: "small",
    events: [
      { at: 0, hand: "right", pose: "fist", holds: "mug", x: .4, y: .38, rot: -.1, face: true },
      { at: 1.6, mood: "excited", jump: 1.6, symbol: "sparkle" },
    ] },
  gift: { duration: 2.4, mood: "happy", mouth: "smile",
    events: [
      { at: 0, hand: "right", pose: "open", holds: "gift", x: .75, y: .65, rot: -.15, bob: { y: .04, freq: 1.5 } },
      { at: .3, symbol: "blush", life: 2 },
    ] },
  bubbles: { duration: 3, mood: "happy", mouth: "small", motion: "sway",
    events: [.15, .4, .62, .9, 1.15, 1.45, 1.7, 2.0].map(at => ({ at, symbol: "bubble" })) },
  whistle: { duration: 3.2, mood: "happy", mouth: "pucker", motion: "sway",
    events: [.25, .6, .95, 1.3, 1.7, 2.05, 2.4].map(at => ({ at, symbol: "note" })) },
  inspect: { duration: 2.6, mood: "curious", mouth: "o",
    events: [{ at: 0, hand: "right", pose: "fist", holds: "magnifier", x: .3, y: .52, rot: 0, face: true }, { at: .25, magnify: 1, zoom: 1.7 }] },
};

export const EMOTE_NAMES = Object.keys(EMOTES);
