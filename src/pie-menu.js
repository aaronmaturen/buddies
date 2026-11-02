// A round menu of wedges around a point. Each wedge is a real button clipped to its shape, so hover, click and
// focus all follow the wedge. Lists too long for one ring page through a More wedge; the center goes back or closes.
// Arrow keys move, Enter picks, Escape goes back. The menu brings its own styles and reads the host page's colors.
const MAX_WEDGES = 8, SIZE = 340, GUTTER = 8, HOLE = .24, GAP = .015;

const CSS = `
.buddy-pie-scrim { position: fixed; inset: 0; z-index: 1000; }
.buddy-pie { position: fixed; border-radius: 50%; }
.buddy-pie button {
  position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; cursor: pointer;
  background: var(--surface, #fff); color: var(--fg, #171a21); font: 600 13px/1.1 system-ui, sans-serif;
}
.buddy-pie button:hover, .buddy-pie button:focus-visible { background: var(--accent, #3451d1); color: var(--accent-fg, #fff); outline: 0; }
.buddy-pie .buddy-pie-ring { position: absolute; inset: 0; border-radius: 50%; background: var(--control-line, #7c8496); }
.buddy-pie span { position: absolute; transform: translate(-50%, -50%); width: 76px; text-align: center; pointer-events: none; }
.buddy-pie .buddy-pie-center { inset: auto; border-radius: 50%; box-shadow: 0 0 0 1px var(--control-line, #7c8496); }
@media (prefers-reduced-motion: no-preference) {
  .buddy-pie { animation: buddy-pie-in .12s ease-out; }
  @keyframes buddy-pie-in { from { transform: scale(.8); opacity: 0; } }
}`;

function addStyles() {
  if (document.getElementById("buddy-pie-styles")) return;
  const style = Object.assign(document.createElement("style"), { id: "buddy-pie-styles", textContent: CSS });
  document.head.append(style);
}

const point = (R, c, a) => `${(c + R * Math.cos(a)).toFixed(2)} ${(c + R * Math.sin(a)).toFixed(2)}`;

function wedgePath(c, R, r, from, to) {
  const large = to - from > Math.PI ? 1 : 0;
  return `M${point(r, c, from)}L${point(R, c, from)}A${R} ${R} 0 ${large} 1 ${point(R, c, to)}L${point(r, c, to)}A${r} ${r} 0 ${large} 0 ${point(r, c, from)}Z`;
}

// One ring at most: a long list shows what fits plus More, which holds the rest.
function fit(items) {
  if (items.length <= MAX_WEDGES) return items;
  return [...items.slice(0, MAX_WEDGES - 1), { label: "More", items: items.slice(MAX_WEDGES - 1) }];
}

function createShell(x, y, size, label) {
  const scrim = Object.assign(document.createElement("div"), { className: "buddy-pie-scrim" });
  // The menu is added to the end of the page, outside the host's landmarks, so it's announced as its own dialog.
  scrim.setAttribute("role", "dialog"); scrim.setAttribute("aria-modal", "true"); scrim.setAttribute("aria-label", label);
  const pie = Object.assign(document.createElement("div"), { className: "buddy-pie" });
  pie.setAttribute("role", "menu"); pie.setAttribute("aria-label", label);
  const c = size / 2;
  pie.style.cssText = `width:${size}px;height:${size}px;left:${Math.min(innerWidth - size - GUTTER, Math.max(GUTTER, x - c))}px;top:${Math.min(innerHeight - size - GUTTER, Math.max(GUTTER, y - c))}px`;
  scrim.append(pie);
  return scrim;
}

function wedgeButton(item, mid, step, { c, hole }, onPress) {
  const b = document.createElement("button");
  b.dataset.wedge = ""; b.setAttribute("role", "menuitem"); b.setAttribute("aria-label", item.label);
  if (item.items) b.setAttribute("aria-haspopup", "menu");
  b.style.clipPath = `path("${wedgePath(c, c - 1, hole, mid - step / 2 + GAP, mid + step / 2 - GAP)}")`;
  const text = document.createElement("span"), r = (c + hole) / 2;
  text.textContent = item.label;
  text.style.left = `${c + r * Math.cos(mid)}px`; text.style.top = `${c + r * Math.sin(mid)}px`;
  b.append(text);
  b.addEventListener("click", e => { e.stopPropagation(); onPress(); });
  return b;
}

function centerButton(text, { c, hole }, onPress) {
  const b = Object.assign(document.createElement("button"), { className: "buddy-pie-center", textContent: text });
  b.style.cssText = `left:${c - hole + 3}px;top:${c - hole + 3}px;width:${2 * hole - 6}px;height:${2 * hole - 6}px`;
  b.setAttribute("role", "menuitem");
  b.addEventListener("click", e => { e.stopPropagation(); onPress(); });
  return b;
}

// items: [{ label, value } or { label, items }]. onPick gets the value; onClose runs once when the menu goes away,
// however that happens. Returns a function that closes the menu, safe to call again.
export function openPieMenu(x, y, items, { label = "Menu", onPick, onClose } = {}) {
  addStyles();
  const opener = document.activeElement;
  const size = Math.min(SIZE, innerWidth - 2 * GUTTER, innerHeight - 2 * GUTTER);
  const scrim = createShell(x, y, size, label), pie = scrim.firstChild, geometry = { c: size / 2, hole: size * HOLE };
  const stack = [];
  let open = true;

  const close = () => {
    if (!open) return;
    open = false;
    scrim.remove();
    document.removeEventListener("keydown", onKey, true);
    opener?.focus?.();
    onClose?.();
  };
  const back = () => { stack.pop(); if (stack.length) show(); else close(); };
  const go = list => { stack.push(fit(list)); show(); };

  function show() {
    pie.replaceChildren(Object.assign(document.createElement("div"), { className: "buddy-pie-ring" }));
    const list = stack.at(-1), step = 2 * Math.PI / list.length;
    list.forEach((item, i) => pie.append(wedgeButton(item, -Math.PI / 2 + i * step, step, geometry, () => {
      if (item.items) return go(item.items);
      close();
      onPick?.(item.value);
    })));
    pie.append(centerButton(stack.length > 1 ? "Back" : "Close", geometry, back));
    pie.querySelector("[data-wedge]").focus();
  }

  function onKey(e) {
    const list = [...pie.querySelectorAll("[data-wedge]")], i = list.indexOf(document.activeElement);
    if (e.key === "Escape") back();
    else if (e.key === "Tab") close();
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") list[(i + 1) % list.length].focus();
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") list[(i - 1 + list.length) % list.length].focus();
    else return;
    e.preventDefault(); e.stopPropagation();
  }

  scrim.addEventListener("click", close);
  document.addEventListener("keydown", onKey, true);
  document.body.append(scrim);
  go(items);
  return close;
}
