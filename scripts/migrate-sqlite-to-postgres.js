#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 开始 SQLite 到 PostgreSQL 数据迁移...');

// 检查环境变量文件
const envMigrationPath = path.join(__dirname, '..', '.env.migration');
if (!fs.existsSync(envMigrationPath)) {
  console.error('❌ 错误：找不到 .env.migration 文件');
  console.log('💡 提示：请创建 .env.migration 文件，包含 PostgreSQL 连接字符串');
  console.log('   格式：DATABASE_URL="postgresql://user:pass@host:5432/db"');
  process.exit(1);
}

// 检查 SQLite 数据库文件（Prisma 中 file:./dev.db 是相对于 prisma/ 目录的）
const sqliteDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
if (!fs.existsSync(sqliteDbPath)) {
  console.error('❌ 错误：找不到 SQLite 数据库文件 prisma/dev.db');
  console.log('💡 提示：请确保 dev.db 文件存在于 prisma/ 目录');
  process.exit(1);
}

// 加载环境变量文件
const envContent = fs.readFileSync(envMigrationPath, 'utf8');
const envLines = envContent.split('\n');

for (const line of envLines) {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex !== -1) {
      const key = trimmedLine.substring(0, equalsIndex).trim();
      const value = trimmedLine.substring(equalsIndex + 1).trim();
      const cleanValue = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = cleanValue;
    }
  }
}

// 检查 PostgreSQL 连接字符串
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误：DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const pgUrl = process.env.DATABASE_URL;
if (!pgUrl.startsWith('postgresql://') && !pgUrl.startsWith('postgres://')) {
  console.error('❌ 错误：DATABASE_URL 必须是 PostgreSQL 连接字符串');
  console.log('💡 提示：URL 必须以 postgresql:// 或 postgres:// 开头');
  process.exit(1);
}

console.log('✅ 环境变量检查通过');

const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const schemaBackupPath = path.join(projectRoot, 'prisma', 'schema.prisma.bak');
const dataDumpPath = path.join(projectRoot, 'scripts', 'migration-data.json');

async function migrateData() {
  try {
    // ===== 第一步：从 SQLite 读取数据 =====
    console.log('\n📦 第一步：从 SQLite 读取数据...');

    // 备份当前 schema
    const originalSchema = fs.readFileSync(schemaPath, 'utf8');
    fs.writeFileSync(schemaBackupPath, originalSchema);

    // 创建临时 SQLite schema
    const sqliteSchema = originalSchema.replace(
      /provider\s*=\s*"postgresql"/,
      'provider = "sqlite"'
    );
    fs.writeFileSync(schemaPath, sqliteSchema);

    // 生成 SQLite Prisma 客户端并读取数据（在子进程中执行，避免模块缓存冲突）
    console.log('🔌 生成 SQLite 客户端并读取数据...');

    // 临时设置为 SQLite URL 用于生成客户端和读取数据
    process.env.DATABASE_URL = 'file:./dev.db';
    execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });

    const readScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function readData() {
  const client = new PrismaClient();
  try {
    const users = await client.user.findMany();
    const articles = await client.article.findMany();
    const comments = await client.comment.findMany();
    const data = { users, articles, comments };
    fs.writeFileSync('${dataDumpPath.replace(/\\/g, '\\\\')}', JSON.stringify(data, null, 2));
    console.log('   找到 ' + users.length + ' 个用户');
    console.log('   找到 ' + articles.length + ' 篇文章');
    console.log('   找到 ' + comments.length + ' 条评论');
  } finally {
    await client.$disconnect();
  }
}
readData().catch(e => { console.error(e); process.exit(1); });
`;

    const readScriptPath = path.join(projectRoot, 'scripts', '_read-sqlite.js');
    fs.writeFileSync(readScriptPath, readScript);

    execSync('node scripts/_read-sqlite.js', { stdio: 'inherit', cwd: projectRoot });

    // 清理临时脚本
    fs.unlinkSync(readScriptPath);

    // 读取 dump 数据
    const dumpData = JSON.parse(fs.readFileSync(dataDumpPath, 'utf8'));
    const { users, articles, comments } = dumpData;

    // ===== 第二步：写入 PostgreSQL =====
    console.log('\n📦 第二步：写入 PostgreSQL...');

    // 确保使用 PostgreSQL schema
    let pgSchema = originalSchema;
    if (!pgSchema.includes('provider = "postgresql"')) {
      pgSchema = originalSchema.replace(
        /provider\s*=\s*"sqlite"/,
        'provider = "postgresql"'
      );
    }
    fs.writeFileSync(schemaPath, pgSchema);

    // 设置环境变量
    process.env.DATABASE_URL = pgUrl;

    // 生成 PostgreSQL Prisma 客户端
    console.log('🔌 生成 PostgreSQL 客户端...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });

    // 同步数据库表结构
    console.log('🏗️  同步数据库表结构...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: projectRoot });

    // 写入数据到 PostgreSQL（在子进程中执行，避免模块缓存冲突）
    console.log('💾 写入数据到 PostgreSQL...');

    const writeScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function writeData() {
  const client = new PrismaClient();
  try {
    const data = JSON.parse(fs.readFileSync('${dataDumpPath.replace(/\\/g, '\\\\')}', 'utf8'));

    // 迁移用户
    console.log('1. 迁移用户数据...');
    for (const user of data.users) {
      try {
        await client.user.create({ data: user });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log('   ⚠️ 用户 ' + user.email + ' 已存在，跳过');
        } else { throw error; }
      }
    }
    console.log('   ✅ 用户数据迁移完成');

    // 迁移文章
    console.log('2. 迁移文章数据...');
    for (const article of data.articles) {
      try {
        await client.article.create({ data: article });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log('   ⚠️ 文章 "' + article.title + '" 已存在，跳过');
        } else { throw error; }
      }
    }
    console.log('   ✅ 文章数据迁移完成');

    // 迁移评论
    console.log('3. 迁移评论数据...');
    for (const comment of data.comments) {
      try {
        await client.comment.create({ data: comment });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log('   ⚠️ 评论 ID ' + comment.id + ' 已存在，跳过');
        } else { throw error; }
      }
    }
    console.log('   ✅ 评论数据迁移完成');

    // 验证
    console.log('\\n📊 验证迁移结果...');
    const uc = await client.user.count();
    const ac = await client.article.count();
    const cc = await client.comment.count();
    console.log('   PostgreSQL 统计: ' + uc + ' 用户, ' + ac + ' 文章, ' + cc + ' 评论');
    console.log('   SQLite 原始数据: ' + data.users.length + ' 用户, ' + data.articles.length + ' 文章, ' + data.comments.length + ' 评论');

    if (uc === data.users.length && ac === data.articles.length && cc === data.comments.length) {
      console.log('\\n🎉 数据迁移成功！');
    } else {
      console.log('\\n⚠️ 数据量不匹配，请检查');
    }
  } finally {
    await client.$disconnect();
  }
}
writeData().catch(e => { console.error('\\n❌ 写入失败:', e.message); process.exit(1); });
`;

    const writeScriptPath = path.join(projectRoot, 'scripts', '_write-pg.js');
    fs.writeFileSync(writeScriptPath, writeScript);

    execSync('node scripts/_write-pg.js', { stdio: 'inherit', cwd: projectRoot });

    // 清理临时脚本和数据文件
    fs.unlinkSync(writeScriptPath);
    fs.unlinkSync(dataDumpPath);

    console.log('\n✨ 迁移流程完成！');

  } catch (error) {
    console.error('\n❌ 迁移失败：', error.message);
    if (error.stack) {
      console.error('错误堆栈：', error.stack);
    }
    process.exit(1);
  } finally {
    // 恢复原始 schema
    if (fs.existsSync(schemaBackupPath)) {
      const backupContent = fs.readFileSync(schemaBackupPath, 'utf8');
      fs.writeFileSync(schemaPath, backupContent);
      fs.unlinkSync(schemaBackupPath);
    }
    // 清理可能残留的临时文件
    for (const f of ['scripts/_read-sqlite.js', 'scripts/_write-pg.js', 'scripts/migration-data.json']) {
      const fp = path.join(projectRoot, f);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  }
}

migrateData();
