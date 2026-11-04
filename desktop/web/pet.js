// The page inside the Mac window: one pet buddy. The rules are the library's (newPet, advance, care); this file
// shows them and talks to the Swift side. window.desktop is what Swift calls; messages go back on "pet".
const { Buddy, fromConfig, animate, setFrameRate, setPointer, newPet, advance, care, petView, petConfig } = Buddies;

const SCALE = .16, GAME_TICK = 5000, MARK_EVERY = 2500, SAVE_EVERY = 30000, DYING = 3000, REGROW = 900;
// The which-hand game: how long it waits for a pick, and how long each reveal plays before the next round.
const PICK_WAIT = 20000, REVEAL = 2000;
const post = message => window.webkit?.messageHandlers?.pet?.postMessage(message);

let pet = window.savedPet?.version === 1 ? window.savedPet : newPet(Date.now());
const buddy = new Buddy(document.getElementById("buddy"), fromConfig(petConfig(pet)), { scale: SCALE, floor: false, readable: true });
let view = null, dying = false, shown = false, lastSave = 0, pointerX = 0;
// While it holds out two fists for you to pick one: the timer that gives up on you.
let picking = null;

setFrameRate(30);
animate(buddy);

function save(now = Date.now()) { lastSave = now; post({ type: "save", pet: JSON.stringify(pet) }); }

function status() {
  post({ type: "status", name: pet.config.name, stage: view.stage, age: view.age, hunger: view.hunger, happy: view.happy,
    discipline: view.discipline, calling: view.calling, asleep: view.mood === "asleep", lightsOff: view.lightsOff, cause: pet.cause,
    fading: view.fading, round: view.game ? view.game.round + 1 : 0, rounds: view.game?.rounds ?? 0, wins: view.game?.wins ?? 0 });
}

// Brings the buddy in line with the pet: egg or grave, mood, mess and size.
function show() {
  view = petView(pet);
  buddy.scale = SCALE * view.size;
  buddy.messes = view.messes;
  buddy.still = view.stage !== "baby" && view.stage !== "child" && view.stage !== "adult" || view.mood === "asleep";
  document.body.classList.toggle("lights-off", view.lightsOff && view.stage !== "dead");
  // An egg is never seen melting out of a head, and neither is anything already there when the app opens;
  // only a buddy that dies while you watch melts into its grave.
  if (view.morph && !buddy.holding && !dying) buddy.morphInto(view.morph, { hold: true, formed: !shown || view.morph === "egg" });
  shown = true;
  if (!view.morph && buddy.holding) buddy.unmorph();
  if (!view.morph) buddy.setMood(view.mood);
  status();
}

function regrow() {
  buddy.vanish();
  setTimeout(() => { buddy.setSpec(fromConfig(petConfig(pet))); buddy.appear(); }, REGROW);
}

// Life events get a moment of their own: the egg melts into the baby, X eyes before the grave, a puff when it
// grows up.
function react(events) {
  if (events.includes("hatch")) buddy.setSpec(fromConfig(petConfig(pet)));
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
  if (picking && !pet.game) stopPicking();
  show();
  if (events.length || now - lastSave > SAVE_EVERY) save(now);
}

const REPLIES = { eat: "eat", gift: "gift", bored: "shrug", full: "no", clean: "proud", medicine: "medicine", well: "refuse", scolded: "nervous", sulk: "sulk", no: "huh" };
const capital = word => word[0].toUpperCase() + word.slice(1);

// Which hand? It holds out two fists until you click one (or pick from the menu), or gets bored and stops.
function holdOutFists() {
  buddy.cancelEmote();
  buddy.emote("pickHand");
  clearTimeout(picking);
  picking = setTimeout(() => { care(pet, "quit", Date.now()); stopPicking(); buddy.emote("huh"); show(); save(); }, PICK_WAIT);
}

function stopPicking() { clearTimeout(picking); picking = null; buddy.cancelEmote(); }

// The gift is in one hand: found it, or it shows you where it was. After the last round, a party for a good score.
function reveal(reply) {
  const [result, side] = reply.split("-");
  stopPicking();
  buddy.emote(`${result === "won" ? "found" : "tease"}${capital(side)}`);
  setTimeout(() => {
    if (pet.game) return holdOutFists();
    const { hearts } = pet.lastGame;
    buddy.emote(hearts ? "party" : "shrug");
    if (hearts > 1) setTimeout(() => buddy.emote("love"), 2400);
  }, REVEAL);
}

function doCare(action, guess) {
  if (action === "guess" && !picking) return;
  const reply = care(pet, action, Date.now(), guess);
  if (reply === "asleep") buddy.mark("z");
  else if (reply === "play") holdOutFists();
  else if (action === "guess") reveal(reply);
  else if (REPLIES[reply]) buddy.emote(REPLIES[reply]);
  show();
  save();
}

// The grave puffs away and the new egg pops in already an egg, so the new buddy stays a surprise until it hatches.
function newEgg() {
  pet = newPet(Date.now());
  buddy.xEyes = false; dying = false;
  buddy.vanish();
  setTimeout(() => {
    buddy.setSpec(fromConfig(petConfig(pet)));
    buddy.appear();
    buddy.morphInto("egg", { hold: true, formed: true });
    show();
  }, REGROW);
  save();
}

// Care itself comes from the app's native menus, which call desktop.care.
window.desktop = {
  // x, y are window pixels from the top left. Returns whether the window should take the mouse: anywhere while it
  // holds out its fists, so a guess never has to hit a small bobbing hand.
  tick(x, y, moved) {
    if (moved) { setPointer(x, y); pointerX = x; }
    return !!picking || buddy.hitTest(x, y);
  },
  // A click: a guess while it holds out its fists (which half of the window), else a boop.
  boop() {
    if (picking) return doCare("guess", pointerX < innerWidth / 2 ? "left" : "right");
    if (view.stage === "egg" || (view.mood !== "asleep" && view.stage !== "dead")) buddy.boop();
  },
  // A right-click on an egg, which has no menu yet: it rocks to show it heard.
  nudge() { buddy.boop(); buddy.mark("question"); },
  care: doCare,
  newEgg,
};

setInterval(tick, GAME_TICK);
setInterval(() => { if (view?.mark && !dying) buddy.mark(view.mark); }, MARK_EVERY);
tick();
save();
