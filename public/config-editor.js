// A JSON editor for buddy configs with autocomplete, checking and hover help, all driven by the library's
// config schema. CodeMirror comes from public/vendor/codemirror.js (see scripts/vendor-codemirror.sh) and
// is only fetched when the editor is first opened.

const unquote = s => { try { return JSON.parse(s); } catch { return s.replace(/^"|"$/g, ""); } };

// The schema node at a path of property names, or null.
function schemaAt(schema, path) {
  let node = schema;
  for (const key of path) node = node?.properties?.[key];
  return node || null;
}

function describeField(node) {
  if (!node) return "";
  if (node.enum) return `One of: ${node.enum.join(", ")}`;
  if (node.type === "number") return `A number from ${node.minimum} to ${node.maximum}`;
  if (node.type === "object") return `Settings: ${Object.keys(node.properties).join(", ")}`;
  if (node.type === "string") return node.maxLength ? `Text, up to ${node.maxLength} characters` : "Text";
  return "";
}

// Property names from the document root down to the syntax node at pos. skipKey drops a property whose name
// the cursor is still typing, so the path is the object that will contain it.
function pathAt(state, tree, pos, { skipKey = false } = {}) {
  const path = [];
  let inKey = false;
  for (let n = tree.resolveInner(pos, -1); n; n = n.parent) {
    if (n.name === "PropertyName") inKey = true;
    if (n.name !== "Property") continue;
    const key = n.getChild("PropertyName");
    if (!key) continue;
    if (skipKey && inKey) { inKey = false; continue; }
    inKey = false;
    path.unshift(unquote(state.sliceDoc(key.from, key.to)));
  }
  return path;
}

// Where each property's key and value sit in the document, by path ("head.color.h").
function locate(state, tree) {
  const locs = new Map();
  const walk = (node, path) => {
    if (!node || node.name !== "Object") return;
    for (let ch = node.firstChild; ch; ch = ch.nextSibling) {
      if (ch.name !== "Property") continue;
      const key = ch.getChild("PropertyName"), value = ch.lastChild;
      if (!key) continue;
      const p = [...path, unquote(state.sliceDoc(key.from, key.to))];
      locs.set(p.join("."), { key, value: value && value !== key ? value : key });
      walk(value, p);
    }
  };
  walk(tree.topNode.firstChild, []);
  return locs;
}

// Problems with the parsed config against the schema: [{ path, at: "key" | "value", severity, message }].
function validate(value, node, path = [], out = []) {
  const name = path.at(-1) || "config";
  const fail = (at, severity, message) => out.push({ path, at, severity, message });
  if (node.enum) {
    if (!node.enum.includes(value)) fail("value", "error", `"${value}" isn't a valid ${name}. Try: ${node.enum.join(", ")}.`);
  } else if (node.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail("value", "error", `${name} should be an object { … }.`), out;
    for (const [k, v] of Object.entries(value)) {
      const child = node.properties[k];
      if (!child) out.push({ path: [...path, k], at: "key", severity: "error", message: `Unknown setting "${k}". ${name} can have: ${Object.keys(node.properties).join(", ")}.` });
      else validate(v, child, [...path, k], out);
    }
  } else if (node.type === "number") {
    if (typeof value !== "number") fail("value", "error", `${name} should be a number from ${node.minimum} to ${node.maximum}.`);
    else if (value < node.minimum || value > node.maximum) {
      fail("value", "warning", `${value} is outside ${node.minimum} to ${node.maximum}; it will be treated as ${Math.min(node.maximum, Math.max(node.minimum, value))}.`);
    }
  } else if (node.type === "string") {
    if (typeof value !== "string") fail("value", "error", `${name} should be text in quotes.`);
    else if (node.maxLength && value.length > node.maxLength) fail("value", "warning", `${name} will be cut to ${node.maxLength} characters.`);
  }
  return out;
}

// onSubmit runs on Cmd/Ctrl+Enter. Throws if CodeMirror can't load, so the caller can keep the plain textarea.
export async function createConfigEditor(textarea, schema, { onSubmit } = {}) {
  const { basicSetup, EditorView, hoverTooltip, keymap, json, jsonLanguage, jsonParseLinter, startCompletion,
    linter, lintGutter, syntaxTree, syntaxHighlighting, HighlightStyle, tags: t } = await import("./vendor/codemirror.js");

  // Insert text, put the cursor `back` characters before its end, and reopen the list for the next step.
  // Completions filter on what's typed after an opening quote, so the replacement reaches back over it too.
  const insert = (text, back = 0, reopen = false) => (view, _c, start, to) => {
    const from = view.state.sliceDoc(start - 1, start) === '"' ? start - 1 : start;
    const after = view.state.sliceDoc(to, to + 1) === '"' ? to + 1 : to;
    view.dispatch({ changes: { from, to: after, insert: text }, selection: { anchor: from + text.length - back } });
    if (reopen) setTimeout(() => startCompletion(view));
  };

  function complete(ctx) {
    const word = ctx.matchBefore(/"?[\w-]*/);
    if (!word || (word.from === word.to && !ctx.explicit && !/[{,:]\s*$/.test(ctx.state.sliceDoc(0, ctx.pos)))) return null;
    const before = ctx.state.sliceDoc(0, word.from).trimEnd(), last = before.at(-1);
    const from = word.text.startsWith('"') ? word.from + 1 : word.from;
    const tree = syntaxTree(ctx.state);
    if (last === ":") {
      const node = schemaAt(schema, pathAt(ctx.state, tree, ctx.pos));
      if (!node) return null;
      if (node.enum) {
        return { from, options: node.enum.map((v, i) => ({ label: v, apply: insert(`"${v}"`), detail: node.enumDescriptions?.[i], type: "enum" })), validFor: /^[\w-]*$/ };
      }
      if (node.type === "number") {
        const mid = Math.round((node.minimum + node.maximum) / 2 * 100) / 100;
        return { from: word.from, options: [{ label: String(mid), detail: `${node.minimum} to ${node.maximum}`, info: node.description, type: "constant" }] };
      }
      if (node.type === "object") return { from: word.from, options: [{ label: "{ }", apply: insert("{}", 1, true), info: node.description, type: "keyword" }] };
      return null;
    }
    if (last === "{" || last === ",") {
      const path = pathAt(ctx.state, tree, ctx.pos, { skipKey: true });
      const node = schemaAt(schema, path);
      if (!node?.properties) return null;
      const present = new Set();
      const obj = locate(ctx.state, tree);
      for (const key of obj.keys()) { const p = key.split("."); if (p.length === path.length + 1 && p.slice(0, -1).join(".") === path.join(".")) present.add(p.at(-1)); }
      const options = Object.entries(node.properties).filter(([k]) => !present.has(k)).map(([k, child]) => ({
        label: k, type: "property", info: child.description, detail: child.enum ? "choice" : child.type,
        apply: child.type === "object" ? insert(`"${k}": {}`, 1, true) : child.enum || child.type === "string" ? insert(`"${k}": ""`, 1, true) : insert(`"${k}": `, 0, true),
      }));
      return { from, options, validFor: /^[\w-]*$/ };
    }
    return null;
  }

  const parseLint = jsonParseLinter();
  const schemaLint = linter(view => {
    const syntax = parseLint(view);
    if (syntax.length) return syntax;
    let data;
    try { data = JSON.parse(view.state.doc.toString()); } catch { return []; }
    const locs = locate(view.state, syntaxTree(view.state));
    return validate(data, schema).map(p => {
      const loc = locs.get(p.path.join("."));
      const node = loc ? loc[p.at] : null;
      return { from: node ? node.from : 0, to: node ? node.to : Math.min(1, view.state.doc.length), severity: p.severity, message: p.message };
    });
  });

  const hover = hoverTooltip((view, pos, side) => {
    const tree = syntaxTree(view.state);
    let n = tree.resolveInner(pos, side);
    while (n && n.name !== "PropertyName") n = n.parent;
    if (!n) return null;
    const node = schemaAt(schema, pathAt(view.state, tree, n.from + 1));
    if (!node) return null;
    return {
      pos: n.from, end: n.to, above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "cm-schema-hint";
        dom.innerHTML = `<strong></strong><span></span>`;
        dom.querySelector("strong").textContent = node.description || "";
        dom.querySelector("span").textContent = describeField(node);
        return { dom };
      },
    };
  });

  const highlight = HighlightStyle.define([
    { tag: t.propertyName, color: "var(--code-key)" },
    { tag: t.string, color: "var(--code-string)" },
    { tag: t.number, color: "var(--code-number)" },
    { tag: [t.bool, t.null], color: "var(--code-number)" },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: "var(--muted)" },
  ]);

  const theme = EditorView.theme({
    "&": { backgroundColor: "var(--surface)", color: "var(--fg)", border: "1px solid var(--line)", borderRadius: "10px", fontSize: "12px" },
    "&.cm-focused": { outline: "2px solid var(--accent)", outlineOffset: "2px" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", maxHeight: "280px", lineHeight: "1.5" },
    ".cm-content": { caretColor: "var(--fg)" },
    ".cm-gutters": { backgroundColor: "var(--surface)", color: "var(--muted)", border: "none", borderRadius: "10px 0 0 10px" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-tooltip": { backgroundColor: "var(--surface)", color: "var(--fg)", border: "1px solid var(--line)", borderRadius: "8px" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--accent-fg)" },
    ".cm-completionDetail": { opacity: ".7", fontStyle: "normal", marginLeft: "1em" },
    ".cm-schema-hint": { display: "grid", gap: "2px", padding: "6px 10px", maxWidth: "320px", fontFamily: "var(--font-body)", fontSize: "13px" },
    ".cm-schema-hint span": { color: "var(--muted)" },
  });

  const host = document.createElement("div");
  host.className = "config-editor";
  textarea.after(host);
  const view = new EditorView({
    parent: host,
    doc: textarea.value,
    extensions: [
      basicSetup, json(), jsonLanguage.data.of({ autocomplete: complete }),
      schemaLint, lintGutter(), hover, syntaxHighlighting(highlight), theme, EditorView.lineWrapping,
      keymap.of([{ key: "Mod-Enter", run: () => { onSubmit?.(); return true; } }]),
    ],
  });
  textarea.hidden = true;

  return {
    get value() { return view.state.doc.toString(); },
    set value(text) { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }); },
    focus() { view.focus(); },
  };
}
