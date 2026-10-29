// Emotes are short one-off reactions layered on top of the current mood.
//   duration  seconds
//   mood      borrowed for the whole emote (any key of MOODS)
//   mouth     shape shown during the emote (any key of MOUTHS)
//   motion    head movement (any key of MOTIONS in emote-player.js)
//   events    things that happen at a time `at`, sorted by `at`:
//             { symbol } spawns a mark, { jump, squash } kicks the bounce springs
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
    events: [{ at: .2, symbol: "z" }, { at: .9, symbol: "z" }, { at: 1.6, symbol: "z" }] },
  blush: { duration: 2, mood: "shy", mouth: "smile", motion: "lookAway",
    events: [{ at: 0, symbol: "blush", life: 2 }] },
  proud: { duration: 1.8, mood: "smug", mouth: "smile", motion: "chinUp",
    events: [{ at: .1, symbol: "sparkle" }, { at: .3, symbol: "sparkle" }, { at: .5, symbol: "sparkle" }, { at: .7, symbol: "sparkle" }] },
  silly: { duration: 1.6, mood: "happy", mouth: "tongue", motion: "wiggle" },
  yes: { duration: 1.1, mouth: "smile", motion: "nod" },
  no: { duration: 1.1, mouth: "flat", motion: "shake" },
};

export const EMOTE_NAMES = Object.keys(EMOTES);
