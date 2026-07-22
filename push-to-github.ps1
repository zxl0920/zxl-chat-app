cd $PSScriptRoot

Write-Host "=== 初始化 Git 仓库 ===" -ForegroundColor Cyan
git init

Write-Host "`n=== 配置用户信息 ===" -ForegroundColor Cyan
git config user.name "zxl0920"
git config user.email "zxl0920@users.noreply.github.com"

Write-Host "`n=== 添加所有文件 ===" -ForegroundColor Cyan
git add .

Write-Host "`n=== 提交代码 ===" -ForegroundColor Cyan
git commit -m "Initial commit: zxl chat assistant app"

Write-Host "`n=== 重命名分支为 main ===" -ForegroundColor Cyan
git branch -M main

Write-Host "`n=== 添加远程仓库 ===" -ForegroundColor Cyan
git remote add origin https://github.com/zxl0920/zxl-chat-app.git

Write-Host "`n=== 推送到 GitHub ===" -ForegroundColor Cyan
git push -u origin main

Write-Host "`n=== 完成！===" -ForegroundColor Green
Write-Host "仓库地址: https://github.com/zxl0920/zxl-chat-app" -ForegroundColor Yellow
