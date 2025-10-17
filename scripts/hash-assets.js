#!/usr/bin/env node
// 简单的静态资源指纹化脚本（无外部依赖）
// 用法：
//   node scripts/hash-assets.js
// 它会为配置中的文件生成短哈希后缀副本（例如 bucaicai.css -> bucaicai.1a2b3c4d.css）
// 并在 index.html 中替换对应引用。会在同目录下生成原始文件的备份 index.html.bak

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');

// 要指纹化的相对文件列表（相对于 repo 根）
const targets = [
  'css/bucaicai.css',
  'css/overrides.css',
  'css/dark.css',
  'css/font-awesome.min.css',
  'vendor/js/jquery-3.4.1.min.js',
  'vendor/js/jquery.fancybox-2.1.5.js',
  'vendor/js/instantpage-3.0.0.js',
  'vendor/js/lazysizes-5.2.0.min.js',
  'JavaScript/loader.js',
  'JavaScript/dark_theme.js',
  'JavaScript/API.js'
];

function sha1hex(buf){
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function ensureFile(p){
  try{ fs.accessSync(p, fs.constants.R_OK); return true; }catch(e){ return false; }
}

function fingerprintFile(rel){
  const abs = path.join(root, rel);
  if(!ensureFile(abs)){
    console.warn('[skip] not found:', rel);
    return null;
  }
  const content = fs.readFileSync(abs);
  const hash = sha1hex(content).slice(0,8);
  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  const base = path.basename(abs, ext);
  const newName = `${base}.${hash}${ext}`;
  const newRel = path.join(path.dirname(rel), newName).replace(/\\/g,'/');
  const newAbs = path.join(dir, newName);
  // 写入副本（覆盖则跳过）
  if(!ensureFile(newAbs)){
    fs.writeFileSync(newAbs, content);
    console.log('[created]', newRel);
  } else {
    console.log('[exists]', newRel);
  }
  return {orig: rel.replace(/\\/g,'/'), hashed: newRel};
}

function run(){
  if(!ensureFile(indexPath)){
    console.error('index.html not found at', indexPath);
    process.exit(1);
  }
  const mapping = [];
  for(const t of targets){
    const r = fingerprintFile(t);
    if(r) mapping.push(r);
  }
  if(mapping.length===0){
    console.warn('no files fingerprinted');
    return;
  }
  // 备份 index.html
  const bak = indexPath + '.bak';
  if(!ensureFile(bak)){
    fs.copyFileSync(indexPath, bak);
    console.log('[backup] created', path.relative(root, bak));
  }
  let html = fs.readFileSync(indexPath,'utf8');
  for(const m of mapping){
    // 只替换精确的路径片段（例如 css/bucaicai.css -> css/bucaicai.<hash>.css）
    const re = new RegExp(m.orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    html = html.replace(re, m.hashed);
    console.log('[replace]', m.orig, '=>', m.hashed);
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('\nDone. 请检查 index.html 并将更改提交到版本控制。');
  console.log('若要为新修改再次指纹化，请在运行前恢复 index.html（备份保存在 index.html.bak）。');
}

run();
