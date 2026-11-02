import { EMOTES, EMOTE_NAMES } from "./emotes.js";
import { MOOD_NAMES } from "./moods.js";
import { MORPHS, MORPH_NAMES } from "./morph.js";
import { openPieMenu } from "./pie-menu.js";
import { words } from "./util.js";

// A leader opens a pie menu and fires what was picked as a "command" event. Nothing happens to any buddy until
// something listens, so the same command can drive buddies on this page, in another app or over a network:
//
//   const leader = new Leader();
//   leader.addEventListener("command", e => { for (const b of buddies) follow(b, e.detail); });
//   canvas.addEventListener("click", e => leader.open(e.clientX, e.clientY, { away: buddy.away }));
//
// A command is plain JSON: { kind: "emote" | "mood" | "morph", name } or { kind: "away", name: "vanish" | "appear" }.

function emoteGroup(name) {
  const events = EMOTES[name].events || [];
  if (events.some(ev => ev.wear || ev.holds)) return "Props";
  return events.some(ev => ev.hand) ? "Hands" : "React";
}

const emoteItems = group => EMOTE_NAMES.filter(n => emoteGroup(n) === group)
  .map(name => ({ label: words(name), value: { kind: "emote", name } }));

export function leaderMenu({ away = false } = {}) {
  return [
    { label: "React", items: emoteItems("React") },
    { label: "Hands", items: emoteItems("Hands") },
    { label: "Props", items: emoteItems("Props") },
    { label: "Mood", items: MOOD_NAMES.map(name => ({ label: words(name), value: { kind: "mood", name } })) },
    { label: "Morph", items: MORPH_NAMES.map(name => ({ label: MORPHS[name].label, value: { kind: "morph", name } })) },
    { label: away ? "Come back" : "Disappear", value: { kind: "away", name: away ? "appear" : "vanish" } },
  ];
}

// Do a command on one buddy.
export function follow(buddy, { kind, name }) {
  if (kind === "emote") buddy.emote(name);
  else if (kind === "mood") buddy.setMood(name);
  else if (kind === "morph") buddy.morphInto(name);
  else if (kind === "away") buddy[name === "appear" ? "appear" : "vanish"]();
}

export class Leader extends EventTarget {
  // x, y are in viewport pixels. away: the buddies are gone, so offer Come back.
  open(x, y, { away = false } = {}) {
    this.close();
    this.closeMenu = openPieMenu(x, y, leaderMenu({ away }), {
      label: "Leader commands",
      onPick: detail => this.dispatchEvent(new CustomEvent("command", { detail })),
      onClose: () => { this.closeMenu = null; },
    });
  }

  close() { this.closeMenu?.(); }
}
