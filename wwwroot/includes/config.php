<?php
/**
 * 配置文件
 */

// 数据库配置
define('DB_TYPE', 'sqlite');

// SQLite配置
define('SQLITE_DB_PATH', __DIR__ . '/../data/watchmedo.db');

// 应用配置
define('APP_TIMEZONE', 'Asia/Shanghai');
define('APP_DEBUG', false);

// 管理后台配置
define('ADMIN_PASSWORD_HASH', '$2y$10$2cuavBf.c.eNRy5A8tVlUO0dQH6wB0yYiWbJ5UdAA2AjZpAxqU58S');

// 在线检测阈值（秒）
define('DEVICE_ONLINE_THRESHOLD', 300);

// AI配置
define('AI_ENABLED', false);
define('AI_API_URL', 'https://api.openai.com/v1/chat/completions');
define('AI_MODEL', 'gpt-3.5-turbo');
define('AI_API_KEY', '');

// 设置时区
date_default_timezone_set(APP_TIMEZONE);

// 错误报告
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
