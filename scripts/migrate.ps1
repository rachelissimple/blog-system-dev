# 数据库迁移脚本 (PowerShell)
# 使用方法：.\scripts\migrate.ps1

Write-Host "🔧 数据库迁移工具" -ForegroundColor Cyan

# 检查 DATABASE_URL 环境变量
if (-not $env:DATABASE_URL) {
    Write-Host "❌ 错误：DATABASE_URL 环境变量未设置" -ForegroundColor Red
    Write-Host "💡 设置方法：" -ForegroundColor Yellow
    Write-Host "   1. 临时设置：`$env:DATABASE_URL = 'postgresql://...'" -ForegroundColor Gray
    Write-Host "   2. 永久设置：[System.Environment]::SetEnvironmentVariable('DATABASE_URL', '...', 'User')" -ForegroundColor Gray
    Write-Host "`n📋 支持的数据库：" -ForegroundColor Cyan
    Write-Host "   - Vercel Postgres" -ForegroundColor Gray
    Write-Host "   - Supabase" -ForegroundColor Gray
    Write-Host "   - Neon" -ForegroundColor Gray
    Write-Host "   - 自建 PostgreSQL" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ DATABASE_URL 已设置" -ForegroundColor Green

# 选择操作
Write-Host "`n🎯 选择要执行的操作：" -ForegroundColor Cyan
Write-Host "1. 生成 Prisma 客户端" -ForegroundColor Gray
Write-Host "2. 运行数据库迁移" -ForegroundColor Gray
Write-Host "3. 重置数据库（危险！会删除所有数据）" -ForegroundColor Red
Write-Host "4. 查看迁移状态" -ForegroundColor Gray
Write-Host "5. 打开 Prisma Studio（数据库管理界面）" -ForegroundColor Gray

$choice = Read-Host "请选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host "📦 生成 Prisma 客户端..." -ForegroundColor Cyan
        try {
            npx prisma generate
            Write-Host "✅ Prisma 客户端生成成功" -ForegroundColor Green
        } catch {
            Write-Host "❌ 生成失败：$_" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "🚀 运行数据库迁移..." -ForegroundColor Cyan
        try {
            npx prisma migrate deploy
            Write-Host "✅ 数据库迁移成功" -ForegroundColor Green
            
            # 显示迁移状态
            Write-Host "`n📊 迁移状态：" -ForegroundColor Cyan
            npx prisma migrate status
        } catch {
            Write-Host "❌ 迁移失败：$_" -ForegroundColor Red
            Write-Host "💡 尝试解决方案：" -ForegroundColor Yellow
            Write-Host "   1. 检查数据库连接" -ForegroundColor Gray
            Write-Host "   2. 检查网络防火墙" -ForegroundColor Gray
            Write-Host "   3. 确认数据库用户权限" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "⚠️  警告：这将删除所有数据！" -ForegroundColor Red
        $confirm = Read-Host "确认重置数据库？输入 'YES' 继续"
        if ($confirm -eq 'YES') {
            try {
                Write-Host "🔄 重置数据库..." -ForegroundColor Yellow
                npx prisma migrate reset --force
                Write-Host "✅ 数据库重置成功" -ForegroundColor Green
            } catch {
                Write-Host "❌ 重置失败：$_" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ 操作已取消" -ForegroundColor Yellow
        }
    }
    "4" {
        Write-Host "📊 查看迁移状态..." -ForegroundColor Cyan
        try {
            npx prisma migrate status
        } catch {
            Write-Host "❌ 获取状态失败：$_" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host "🔧 启动 Prisma Studio..." -ForegroundColor Cyan
        Write-Host "💡 访问 http://localhost:5555 管理数据库" -ForegroundColor Yellow
        Write-Host "📌 按 Ctrl+C 停止服务" -ForegroundColor Gray
        try {
            npx prisma studio
        } catch {
            Write-Host "❌ 启动失败：$_" -ForegroundColor Red
        }
    }
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
    }
}

Write-Host "`n✅ 操作完成" -ForegroundColor Green