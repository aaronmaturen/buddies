// Page colors the buddies draw with when they have no visible head: ink from --fg, paper from --surface.
// Kept live as the page switches between light and dark.
export const theme = { fg: "#171a21", surface: "#f7f8fb", dark: false };

function read(root, darkQuery) {
  const cs = getComputedStyle(root);
  theme.fg = cs.getPropertyValue("--fg").trim() || theme.fg;
  theme.surface = cs.getPropertyValue("--surface").trim() || theme.surface;
  const t = root.getAttribute("data-theme");
  theme.dark = t === "dark" || (t !== "light" && darkQuery.matches);
}

// Importing the library on a server (server-side rendering) must not touch the browser.
if (typeof document !== "undefined") {
  const root = document.documentElement, darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const update = () => read(root, darkQuery);
  update();
  darkQuery.addEventListener("change", update);
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
