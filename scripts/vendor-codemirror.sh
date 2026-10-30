#!/usr/bin/env bash
# Rebuilds public/vendor/codemirror.js: one ES module with just the CodeMirror pieces the config editor uses.
# CodeMirror breaks if two copies of its core load, and public CDNs either link mismatched versions or build
# on demand, so we bundle exact versions once and serve the file ourselves. Run this only to upgrade.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cat > "$WORK/package.json" <<'JSON'
{
  "private": true,
  "dependencies": {
    "codemirror": "6.0.2",
    "@codemirror/state": "6.7.6",
    "@codemirror/view": "6.43.14",
    "@codemirror/language": "6.13.1",
    "@codemirror/autocomplete": "6.20.3",
    "@codemirror/lint": "6.9.7",
    "@codemirror/search": "6.7.2",
    "@codemirror/commands": "6.11.1",
    "@codemirror/lang-json": "6.0.2",
    "@lezer/highlight": "1.2.5",
    "@lezer/json": "1.0.3",
    "@lezer/common": "1.5.3",
    "esbuild": "0.28.2"
  },
  "overrides": {
    "@codemirror/state": "6.7.6",
    "@codemirror/view": "6.43.14",
    "@codemirror/language": "6.13.1",
    "@codemirror/autocomplete": "6.20.3",
    "@codemirror/lint": "6.9.7",
    "@codemirror/search": "6.7.2",
    "@codemirror/commands": "6.11.1",
    "@lezer/highlight": "1.2.5",
    "@lezer/common": "1.5.3"
  }
}
JSON

cat > "$WORK/entry.js" <<'JS'
export { basicSetup } from "codemirror";
export { EditorView, hoverTooltip, keymap } from "@codemirror/view";
export { json, jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
export { startCompletion } from "@codemirror/autocomplete";
export { linter, lintGutter } from "@codemirror/lint";
export { syntaxTree, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
export { tags } from "@lezer/highlight";
JS

cd "$WORK"
npm install --silent --no-audit --no-fund
npx esbuild entry.js --bundle --format=esm --minify --legal-comments=none \
  --banner:js="// CodeMirror 6 (MIT, codemirror.net) bundled by scripts/vendor-codemirror.sh. Do not edit." \
  --outfile="$ROOT/public/vendor/codemirror.js"
ls -l "$ROOT/public/vendor/codemirror.js"
