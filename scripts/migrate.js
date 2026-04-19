#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 使用方法：
 * 1. 设置环境变量 DATABASE_URL
 * 2. 运行：node scripts/migrate.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 开始数据库迁移...');

// 检查环境变量
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误：DATABASE_URL 环境变量未设置');
  console.log('💡 提示：请设置 DATABASE_URL 环境变量');
  console.log('   例如：export DATABASE_URL="postgresql://user:pass@host:5432/db"');
  process.exit(1);
}

// 检查 Prisma schema 文件
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ 错误：找不到 Prisma schema 文件：${schemaPath}`);
  process.exit(1);
}

try {
  console.log('📦 生成 Prisma 客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🚀 运行数据库迁移...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('✅ 数据库迁移完成！');
  
  // 可选：显示数据库状态
  console.log('\n📊 数据库状态：');
  execSync('npx prisma migrate status', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ 迁移失败：', error.message);
  process.exit(1);
}