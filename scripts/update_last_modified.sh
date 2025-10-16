#!/bin/sh
# POSIX-compatible wrapper to update index.html data-last-modified using git
# Prefer pwsh if available (for robust replacement), else use sed/perl fallback.

TOP=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$TOP" ]; then
  exit 0
fi

INDEX="$TOP/index.html"
if [ ! -f "$INDEX" ]; then
  exit 0
fi

TIME=$(git log -1 --format=%ci -- index.html 2>/dev/null || echo "")
TIME=$(echo "$TIME" | tr -d '\n' | sed -e 's/^[[:space:]]*//;s/[[:space:]]*$//')
if [ -z "$TIME" ]; then
  exit 0
fi

if command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -ExecutionPolicy Bypass -File "$TOP/scripts/update_last_modified.ps1"
  exit 0
fi

# Fallback: try to inject or replace data-last-modified attribute using perl
perl -0777 -pe "if (s/(<html\\b[^>]*?)\\sdata-last-modified=\"[^\"]*\"/\$1 data-last-modified=\"$TIME\"/s) { } else { s/(<html\\b)/\$1 data-last-modified=\"$TIME\"/s } print;" "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX" && git add "$INDEX" || true

exit 0