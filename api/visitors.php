<?php
// Simple visitor counter API for the static site
// GET returns JSON: {"site_pv":..., "today_pv":...}
// POST increments counters and returns updated JSON

header('Content-Type: application/json');
// Allow CORS so static site hosted on vercel can fetch
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$storage = __DIR__ . '/visitors.json';
$today = date('Y-m-d');

// Initialize file if not exists
if (!file_exists($storage)) {
    $initial = [
        'site_pv' => 0,
        'daily' => [ $today => 0 ]
    ];
    file_put_contents($storage, json_encode($initial, JSON_PRETTY_PRINT));
}

// Open with locking
$fp = fopen($storage, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot open storage']);
    exit;
}
flock($fp, LOCK_EX);
$contents = stream_get_contents($fp);
$data = $contents ? json_decode($contents, true) : null;
if (!is_array($data)) $data = ['site_pv' => 0, 'daily' => []];
if (!isset($data['daily'])) $data['daily'] = [];

// Ensure today's key exists
if (!isset($data['daily'][$today])) $data['daily'][$today] = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Simple increment; optionally you could filter or check IP to prevent abuse
    $data['site_pv'] = isset($data['site_pv']) ? (int)$data['site_pv'] + 1 : 1;
    $data['daily'][$today] = (int)$data['daily'][$today] + 1;
    // Truncate and write
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
}

// Return sanitized JSON
$response = [
    'site_pv' => (int)$data['site_pv'],
    'today_pv' => (int)($data['daily'][$today] ?? 0),
];

flock($fp, LOCK_UN);
fclose($fp);

echo json_encode($response);
