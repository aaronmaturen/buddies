// The page inside the Mac window: one pet buddy. The rules are the library's (newPet, advance, care); this file
// shows them and talks to the Swift side. window.desktop is what Swift calls; messages go back on "pet".
const { Buddy, fromConfig, animate, setFrameRate, setPointer, newPet, advance, care, petView, petConfig, openPieMenu } = Buddies;

const SCALE = .16, GAME_TICK = 5000, MARK_EVERY = 2500, SAVE_EVERY = 30000, DYING = 3000, REGROW = 900;
const post = message => window.webkit?.messageHandlers?.pet?.postMessage(message);

let pet = window.savedPet?.version === 1 ? window.savedPet : newPet(Date.now());
const buddy = new Buddy(document.getElementById("buddy"), fromConfig(petConfig(pet)), { scale: SCALE, floor: false, readable: true });
let view = null, menuOpen = false, dying = false, lastSave = 0;

setFrameRate(30);
animate(buddy);

function save(now = Date.now()) { lastSave = now; post({ type: "save", pet: JSON.stringify(pet) }); }

function status() {
  post({ type: "status", name: pet.config.name, stage: view.stage, age: view.age, hunger: view.hunger, happy: view.happy,
    discipline: view.discipline, calling: view.calling, asleep: view.mood === "asleep", lightsOff: view.lightsOff, cause: pet.cause });
}

// Brings the buddy in line with the pet: egg or grave, mood, mess and size.
function show() {
  view = petView(pet);
  buddy.scale = SCALE * view.size;
  buddy.messes = view.messes;
  buddy.still = view.stage !== "baby" && view.stage !== "child" && view.stage !== "adult" || view.mood === "asleep";
  document.body.classList.toggle("lights-off", view.lightsOff && view.stage !== "dead");
  if (view.morph && !buddy.holding && !dying) buddy.morphInto(view.morph, { hold: true });
  if (!view.morph && buddy.holding) buddy.unmorph();
  if (!view.morph) buddy.setMood(view.mood);
  status();
}

function regrow() {
  buddy.vanish();
  setTimeout(() => { buddy.setSpec(fromConfig(petConfig(pet))); buddy.appear(); }, REGROW);
}

// Life events get a moment of their own: X eyes before the grave, a puff when it grows up.
function react(events) {
  if (events.includes("grow")) regrow();
  if (events.includes("sick")) buddy.mark("sweat");
  if (events.includes("die")) {
    dying = true; buddy.xEyes = true; buddy.setMood("sad");
    setTimeout(() => { dying = false; buddy.xEyes = false; show(); }, DYING);
  }
}

function tick() {
  const now = Date.now(), events = advance(pet, now);
  react(events);
  show();
  if (events.length || now - lastSave > SAVE_EVERY) save(now);
}

const REPLIES = { eat: "eat", full: "no", clean: "proud", medicine: "medicine", scolded: "nervous", sulk: "sulk", no: "huh" };

function doCare(action, guess) {
  const reply = care(pet, action, Date.now(), guess);
  if (reply === "asleep") buddy.mark("z");
  else if (reply.startsWith("won") || reply.startsWith("lost")) {
    buddy.look(reply.endsWith("left") ? -1 : 1);
    setTimeout(() => buddy.emote(reply.startsWith("won") ? "laugh" : "huh"), 700);
  } else if (REPLIES[reply]) buddy.emote(REPLIES[reply]);
  show();
  save();
}

function newEgg() {
  pet = newPet(Date.now());
  buddy.xEyes = false; dying = false;
  if (buddy.holding) buddy.unmorph();
  regrow();
  show();
  save();
}

function careItems() {
  if (view.stage === "dead") return [{ label: "New egg", value: { newEgg: true } }];
  return [
    { label: "Feed", value: { action: "feed" } },
    { label: "Play", items: [{ label: "Left", value: { action: "play", guess: "left" } }, { label: "Right", value: { action: "play", guess: "right" } }] },
    { label: "Clean", value: { action: "clean" } },
    { label: "Medicine", value: { action: "medicine" } },
    { label: view.lightsOff ? "Lights on" : "Lights off", value: { action: "lights" } },
    { label: "Scold", value: { action: "scold" } },
  ];
}

window.desktop = {
  // x, y are window pixels from the top left. Returns whether the window should take the mouse.
  tick(x, y, moved) {
    if (moved) setPointer(x, y);
    return menuOpen || buddy.hitTest(x, y);
  },
  boop() {
    if (view.stage === "egg" || (view.mood !== "asleep" && view.stage !== "dead")) buddy.boop();
  },
  menu(x, y) {
    // An egg has nothing to care for yet, so it just rocks to show it heard.
    if (view.stage === "egg") { buddy.boop(); buddy.mark("question"); return; }
    if (menuOpen || dying) return;
    menuOpen = true;
    post({ type: "menu", open: true });
    openPieMenu(x, y, careItems(), {
      label: `Care for ${pet.config.name}`,
      onPick: pick => (pick.newEgg ? newEgg() : doCare(pick.action, pick.guess)),
      onClose: () => { menuOpen = false; post({ type: "menu", open: false }); },
    });
  },
  care: doCare,
  newEgg,
};

setInterval(tick, GAME_TICK);
setInterval(() => { if (view?.mark && !dying) buddy.mark(view.mark); }, MARK_EVERY);
tick();
save();
