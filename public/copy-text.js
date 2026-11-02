// Copy to the clipboard, with the old textarea trick where the clipboard API is missing or refused.
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text });
    area.style.position = "fixed"; area.style.opacity = "0";
    document.body.append(area); area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
