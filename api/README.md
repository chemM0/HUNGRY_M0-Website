Visitors API
=============

This is a tiny PHP endpoint to replace external visitor counters like Busuanzi.

Deployment:
1. Upload the `api/visitors.php` to your virtual host under `/api/visitors.php`.
2. Ensure PHP is enabled and writable permissions exist for the `api/` directory (it will create `visitors.json`).
3. If your static site is hosted on Vercel, set the global JS variable `VISITOR_API_URL` to the full URL of this PHP endpoint in your `index.html` or in a separate script before `JavaScript/visitors.js`.

Security:
- This is intentionally simple. If you want to avoid double counting from bots or refreshes, consider adding IP-based deduplication or cookie-based throttling.

API:
- POST /api/visitors.php: increment counters and return updated JSON
- GET /api/visitors.php: return JSON with fields `site_pv` and `today_pv`
