#!/usr/bin/env pwsh
# Update index.html's data-last-modified attribute to the latest git commit time for that file.
# This script is safe to run multiple times and will `git add index.html` when it changes.
try {
    $top = git rev-parse --show-toplevel 2>$null
    if (-not $top) { exit 0 }
    $top = $top.Trim()
    Set-Location $top

    $time = git log -1 --format=%ci -- index.html 2>$null
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
