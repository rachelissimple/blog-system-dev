# Vercel 部署脚本
# 使用方法：.\scripts\deploy.ps1

Write-Host "🚀 开始 Vercel 部署流程..." -ForegroundColor Cyan

# 检查是否已安装 Vercel CLI
try {
    $vercelVersion = vercel --version 2>$null
    if (-not $vercelVersion) {
        Write-Host "📦 安装 Vercel CLI..." -ForegroundColor Yellow
        npm install -g vercel
    }
    Write-Host "✅ Vercel CLI 版本: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 安装 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# 检查 Git 仓库状态
Write-Host "🔍 检查 Git 仓库状态..." -ForegroundColor Cyan
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Host "⚠️  发现未提交的更改：" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    
    $choice = Read-Host "是否提交更改？(y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        $commitMessage = Read-Host "输入提交信息"
        if (-not $commitMessage) {
            $commitMessage = "部署更新 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        
        git add .
        git commit -m $commitMessage
        git push origin main
        Write-Host "✅ 代码已提交并推送" -ForegroundColor Green
    }
}

# 构建测试
Write-Host "🏗️  运行本地构建测试..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ 本地构建测试通过" -ForegroundColor Green
} catch {
    Write-Host "❌ 本地构建测试失败，请检查错误" -ForegroundColor Red
    exit 1
}

# 环境变量检查
Write-Host "🔧 检查环境变量..." -ForegroundColor Cyan
$requiredVars = @("DATABASE_URL", "JWT_SECRET", "ADMIN_EMAILS")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  缺少以下环境变量：" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Gray
    }
    
    Write-Host "💡 请在 Vercel 控制台中设置这些环境变量" -ForegroundColor Cyan
    Write-Host "   Vercel 控制台: https://vercel.com/dashboard" -ForegroundColor Cyan
}

# 部署选项
Write-Host "`n🎯 选择部署方式：" -ForegroundColor Cyan
Write-Host "1. 生产环境部署 (生产域名)" -ForegroundColor Gray
Write-Host "2. 预览环境部署 (临时域名)" -ForegroundColor Gray
Write-Host "3. 仅推送代码到 Git，不部署" -ForegroundColor Gray

$choice = Read-Host "请选择 (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🚀 开始生产环境部署..." -ForegroundColor Green
        vercel --prod
    }
    "2" {
        Write-Host "🚀 开始预览环境部署..." -ForegroundColor Green
        vercel
    }
    "3" {
        Write-Host "📤 推送代码到 Git 仓库..." -ForegroundColor Green
        git push origin main
        Write-Host "✅ 代码已推送，请前往 Vercel 控制台手动部署" -ForegroundColor Green
        Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
    }
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
    }
}

Write-Host "`n✅ 部署流程完成！" -ForegroundColor Green
Write-Host "📋 后续步骤：" -ForegroundColor Cyan
Write-Host "1. 在 Vercel 控制台检查部署状态" -ForegroundColor Gray
Write-Host "2. 运行数据库迁移 (如果需要)" -ForegroundColor Gray
Write-Host "3. 测试网站功能" -ForegroundColor Gray