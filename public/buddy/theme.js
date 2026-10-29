// Page colors the buddies draw with when they have no visible head: ink from --fg, paper from --surface.
// Kept live as the page switches between light and dark.
export const theme = { fg: "#171a21", surface: "#f7f8fb", dark: false };

const root = document.documentElement;
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function read() {
  const cs = getComputedStyle(root);
  theme.fg = cs.getPropertyValue("--fg").trim() || theme.fg;
  theme.surface = cs.getPropertyValue("--surface").trim() || theme.surface;
  const t = root.getAttribute("data-theme");
  theme.dark = t === "dark" || (t !== "light" && darkQuery.matches);
}

read();
darkQuery.addEventListener("change", read);
new MutationObserver(read).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
