#!/bin/sh
# POSIX-compatible script to set index.html data-last-modified to CURRENT local time (ISO8601 with timezone).
# Prefer pwsh if available (uses the PowerShell script), else fallback to perl replacement.

TOP=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$TOP" ]; then
  exit 0
fi

INDEX="$TOP/index.html"
if [ ! -f "$INDEX" ]; then
  exit 0
fi

if command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -ExecutionPolicy Bypass -File "$TOP/scripts/update_last_modified.ps1"
  exit 0
fi

# Compute NOW in ISO-8601 with timezone. Prefer `date -Iseconds` if available.
if date -Iseconds >/dev/null 2>&1; then
  TIME=$(date -Iseconds)
else
  # Fallback: %z gives +0800; insert a colon before the last two digits to become +08:00
  TIME=$(date "+%Y-%m-%dT%H:%M:%S%z" | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/')
fi

# Fallback replacement using perl
perl -0777 -pe "if (s/(<html\\b[^>]*?)\\sdata-last-modified=\"[^\"]*\"/\$1 data-last-modified=\"$TIME\"/s) { } else { s/(<html\\b)/\$1 data-last-modified=\"$TIME\"/s } print;" "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX" && git add "$INDEX" || true

exit 0