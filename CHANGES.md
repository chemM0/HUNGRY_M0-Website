变更日志

- 2025-10-16: 将侧边栏的“本站访客数”改为显示“最后编辑时间”（基于 document.lastModified），并在页面脚本中格式化显示时间。
-- 2025-10-16: 从 `index.html` 中移除了对 `vendor/js/busuanzi-2.3.pure.mini.js` 的自动加载，以避免外部统计脚本导致卡片样式错乱。
- 2025-10-16: 彻底删除文件 `vendor/js/busuanzi-2.3.pure.mini.js`（已从仓库移除）。
- 2025-10-16: 在 `css/overrides.css` 中添加了少量样式，保证 `.webinfo` 卡片布局稳定，防止显示错乱。

- 2025-10-16: 使用 Git 最近提交时间注入到 `<html data-last-modified="...">`，页面脚本现在优先显示该时间（如存在），否则回退到 document.lastModified。

说明：busuanzi 源文件已被删除。如果需要恢复，需重新添加相应脚本文件并在页面中引入。

自动化：新增 `scripts/update_last_modified.ps1`（PowerShell 脚本）与 `.githooks/pre-commit` 钩子模板。
- `scripts/update_last_modified.ps1`：在提交时将 `index.html` 的 `data-last-modified` 属性设置为该文件在 Git 中的最近提交时间，并在变化时自动 `git add index.html`。
- `.githooks/pre-commit`：一个可启用的钩子模板，用于在本地仓库中运行上述脚本。要启用，请执行：

	```powershell
	# 在仓库根运行一次以启用本地 githooks 目录
	git config core.hooksPath .githooks
	```

这不会在服务器端自动启用钩子；若希望在 CI/部署中也注入更新时间，请告知，我可以提供一个在部署步骤运行 `scripts/update_last_modified.ps1` 的示例命令。

	补充：增加了一个跨平台 wrapper `scripts/update_last_modified.sh`（POSIX sh），当环境中没有 PowerShell Core 时，CI 或 Unix 工作站可使用该脚本作为替代运行更新逻辑。