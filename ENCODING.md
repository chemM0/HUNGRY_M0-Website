长期编码方案 (UTF-8)

目的：避免 Windows 上脚本或文本文件出现中文乱码问题。

推荐步骤：

1. 使用 UTF-8 编码保存文件
   - 所有源文件（HTML/CSS/JS/PS1/SH/BAT/MD 等）统一使用 UTF-8 编码。Windows 上的脚本推荐无 BOM 的 UTF-8，但 PowerShell 脚本可以使用 UTF-8。

2. 添加 .gitattributes（强制文本文件编码）
   在仓库根目录添加或更新 .gitattributes，示例：
   *.html text working-tree-encoding=UTF-8
   *.css text working-tree-encoding=UTF-8
   *.js text working-tree-encoding=UTF-8
   *.ps1 text working-tree-encoding=UTF-8
   *.sh text eol=lf
   *.bat text working-tree-encoding=GBK

   说明：Windows 批处理文件（.bat）在某些工具链中可能首选 GBK 编码以便命令行显示中文，但建议尽量改用 UTF-8 并在控制台或 PowerShell 中设置为 UTF-8（chcp 65001 或使用 pwsh）。如果你必须使用 GBK，请在 .gitattributes 中为 .bat 指定 encoding=GBK。

3. Git 配置（全局）：
   - 禁用自动转换导致的问题：
     git config --global core.autocrlf false
   - 确保提交时不改变编码：
     git config --global core.eol lf

4. 编辑器/IDE（VS Code）设置：
   - 设置文件编码为 UTF-8：
     "files.encoding": "utf8"
   - 在状态栏选择并保存为 UTF-8（无 BOM）

5. 钩子与 CI：
   - 在 CI 或 pre-commit hook 中检查文件编码，例如使用 iconv 或 Python 脚本验证 UTF-8。

6. 运行时（Windows 控制台）提示：
   - 对于 PowerShell Core (pwsh)：默认支持 UTF-8。如果旧版 PowerShell/ cmd.exe，需要在脚本头或命令中运行：
     chcp 65001
     或者在 PowerShell 中： $OutputEncoding = [System.Text.Encoding]::UTF8

附注：本项目中大多数文件已包含 meta charset="utf-8"，并且 PowerShell 脚本也使用 Set-Content -Encoding UTF8。建议统一为 UTF-8 并在必要时使用 .gitattributes 强制化。
