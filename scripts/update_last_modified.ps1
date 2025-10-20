#!/usr/bin/env pwsh
# Update index.html's data-last-modified attribute to the latest git commit time for that file.
# This script is safe to run multiple times and will `git add index.html` when it changes.
try {
    $top = git rev-parse --show-toplevel 2>$null
    if (-not $top) { exit 0 }
    $top = $top.Trim()
    Set-Location $top

    # Prefer the latest commit time for the repository excluding index.html itself.
    # This prevents the timestamp being overwritten by the script's own update of index.html.
    # Try pathspec exclusion (modern git)
    $time = git log -1 --format=%cI -- . ":(exclude)index.html" 2>$null
+    if (-not $time) {
+        # If exclude not supported or returns nothing, iterate recent commits and pick the first commit that did NOT touch index.html.
+        $commits = git rev-list --max-count=200 HEAD 2>$null
+        foreach ($c in $commits) {
+            $files = git diff-tree --no-commit-id --name-only -r $c 2>$null
+            if ($files -and ($files -notcontains 'index.html')) {
+                $time = git show -s --format=%cI $c 2>$null
+                break
+            }
+        }
+        # Final fallback: use index.html's last commit time if nothing else found
+        if (-not $time) {
+            $time = git log -1 --format=%cI -- index.html 2>$null
+        }
+    }
@@
    if (-not $time) { exit 0 }
    $time = $time.Trim()

    $index = Join-Path $top 'index.html'
    if (-not (Test-Path $index)) { exit 0 }

    $content = Get-Content $index -Raw -ErrorAction Stop

    $pattern = '(<html\b[^>]*?)\sdata-last-modified="[^"]*"'
    if ([regex]::IsMatch($content, $pattern)) {
        $new = [regex]::Replace($content, $pattern, '$1 data-last-modified="' + $time + '"')
    } else {
        $new = $content -replace '(<html\b)', '<html data-last-modified="' + $time + '"'
    }

    if ($new -ne $content) {
        Set-Content -Path $index -Value $new -Encoding UTF8
        git add index.html
    }
} catch {
    # swallow errors in hook context
    exit 0
}
