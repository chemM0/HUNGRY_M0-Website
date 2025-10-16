变更日志

- 2025-10-16: 将侧边栏的“本站访客数”改为显示“最后编辑时间”（基于 document.lastModified），并在页面脚本中格式化显示时间。
- 2025-10-16: 从 `index.html` 中移除了对 `vendor/js/busuanzi-2.3.pure.mini.js` 的自动加载，以避免外部统计脚本导致卡片样式错乱（脚本文件仍保留在 `vendor/js/`）。
- 2025-10-16: 在 `css/overrides.css` 中添加了少量样式，保证 `.webinfo` 卡片布局稳定，防止显示错乱。

- 2025-10-16: 使用 Git 最近提交时间注入到 `<html data-last-modified="...">`，页面脚本现在优先显示该时间（如存在），否则回退到 document.lastModified。

说明：如果希望彻底删除 busuanzi 源文件或在所有页面同步移除，请说明，我可以一并处理。