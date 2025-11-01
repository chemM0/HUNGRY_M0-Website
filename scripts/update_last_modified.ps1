#!/usr/bin/env pwsh
# Update index.html's data-last-modified attribute to the CURRENT local time with timezone.
# This makes the homepage show the push/commit time precisely.
try {
    $top = git rev-parse --show-toplevel 2>$null
    if (-not $top) { exit 0 }
    $top = $top.Trim()
    Set-Location $top

    # Use local time with timezone offset, ISO-8601 without milliseconds (e.g., 2025-11-02T21:30:15+08:00)
    $time = [System.DateTimeOffset]::Now.ToString('yyyy-MM-ddTHH:mm:sszzz')

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
