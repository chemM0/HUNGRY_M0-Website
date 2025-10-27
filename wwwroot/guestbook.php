<?php
// Simple file-based guestbook API
// Methods:
//  GET:  return latest comments
//  POST: add a comment {name, message}
//  Storage: wwwroot/data/guestbook.json

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$root = dirname(__DIR__);
$dataDir = $root . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'guestbook.json';
$rateFile = $dataDir . DIRECTORY_SEPARATOR . 'guestbook_rate.json';

function read_json($file){
    if(!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if($raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function write_json_atomic($file, $data){
    $tmp = $file . '.tmp';
    $fp = @fopen($tmp, 'w');
    if(!$fp) return false;
    @fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    @fclose($fp);
    return @rename($tmp, $file);
}

function client_ip(){
    foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_CLIENT_IP','REMOTE_ADDR'] as $h){
        if(!empty($_SERVER[$h])){ $ip = trim(explode(',', $_SERVER[$h])[0]); if($ip) return $ip; }
    }
    return '0.0.0.0';
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET'){
    $items = read_json($dataFile);
    // newest first
    usort($items, function($a,$b){ return ($b['ts']??0) <=> ($a['ts']??0); });
    echo json_encode(['ok'=>true, 'items'=>array_slice($items,0,50)], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

if ($method === 'POST'){
    $input = file_get_contents('php://input');
    $json = json_decode($input, true);
    $name = trim($json['name'] ?? '');
    $message = trim($json['message'] ?? '');

    if ($name === '') $name = '匿名';
    if ($name && mb_strlen($name,'UTF-8') > 24) return print json_encode(['ok'=>false,'error'=>'昵称过长'], JSON_UNESCAPED_UNICODE);
    if ($message === '' || mb_strlen($message,'UTF-8') < 1) return print json_encode(['ok'=>false,'error'=>'内容不能为空'], JSON_UNESCAPED_UNICODE);
    if (mb_strlen($message,'UTF-8') > 300) return print json_encode(['ok'=>false,'error'=>'内容过长（最多300字）'], JSON_UNESCAPED_UNICODE);

    // simple rate limit per IP: 45s
    $ip = client_ip();
    $now = time();
    $rates = read_json($rateFile);
    $last = (int)($rates[$ip] ?? 0);
    if ($now - $last < 45) {
        $left = 45 - ($now - $last);
        echo json_encode(['ok'=>false,'error'=>'请稍后再试（'.$left.'s）'], JSON_UNESCAPED_UNICODE); exit;
    }

    // read-modify-write with file lock
    $items = read_json($dataFile);
    $id = 1;
    if (!empty($items)){
        $lastId = 0;
        foreach($items as $it){ $lastId = max($lastId, (int)($it['id']??0)); }
        $id = $lastId + 1;
    }
    $record = [
        'id' => $id,
        'name' => $name,
        'message' => $message,
        'time' => date('Y-m-d H:i:s'),
        'ts' => $now,
        'ip' => $ip
    ];

    // Use flock for concurrency safety
    $fp = @fopen($dataFile, 'c+');
    if(!$fp){ echo json_encode(['ok'=>false,'error'=>'无法写入数据文件'], JSON_UNESCAPED_UNICODE); exit; }
    @flock($fp, LOCK_EX);
    $existing = stream_get_contents($fp);
    $arr = $existing ? json_decode($existing,true) : [];
    if(!is_array($arr)) $arr = [];
    $arr[] = $record;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($arr, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    fflush($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);

    // update rate file
    $rates[$ip] = $now;
    write_json_atomic($rateFile, $rates);

    echo json_encode(['ok'=>true, 'id'=>$id], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(405);
echo json_encode(['ok'=>false,'error'=>'Method Not Allowed']);
