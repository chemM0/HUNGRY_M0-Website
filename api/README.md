访客统计 API
=============

这是一个用于替代 Busuanzi 等外部访客统计的极简 PHP 接口。

部署方法：
1. 将 `api/visitors.php` 上传到你的虚拟主机（路径为 `/api/visitors.php`）。
2. 确保主机已开启 PHP 且 `api/` 目录有写权限（脚本会自动创建 `visitors.json` 文件）。
3. 如果你的静态站部署在 Vercel，请在 `index.html` 或 `JavaScript/visitors.js` 之前插入如下 JS 变量：
	<script>window.VISITOR_API_URL = '你的 PHP 接口完整地址';</script>

安全性说明：
- 本接口为极简实现，未做防刷或去重。如需防止刷量，可自行扩展（如 IP 去重、cookie 限流等）。

API 用法：
- POST /api/visitors.php：自增计数并返回最新 JSON
- GET /api/visitors.php：返回当前总访问量和今日访问量（JSON，字段为 `site_pv` 和 `today_pv`）
