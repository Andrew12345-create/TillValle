#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function sha256hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Default patterns to detect (add more as needed)
const patterns = [
  { name: 'Google API Key', re: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: 'OpenAI/Generic sk', re: /sk-[A-Za-z0-9]{16,}/g },
  { name: 'AWS Access Key ID', re: /AKIA[0-9A-Z]{16}/g },
  // Generic long token: 32+ alnum/punctuation (conservative)
  { name: 'Long token (32+)', re: /[A-Za-z0-9_\-]{32,}/g }
];

// Files to include (extensions) - keep relatively small set to avoid binary blobs
const includeExt = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.env', '.html', '.css', '.py', '.sh', '.md']);

function gitTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

function scrambleContent(content, salt) {
  let replaced = false;
  let newContent = content;
  for (const p of patterns) {
    newContent = newContent.replace(p.re, (m) => {
      replaced = true;
      const h = sha256hex((salt || '') + m).slice(0, 16);
      return `SCRAMBLED_${p.name.replace(/\s+/g,'')}_${h}`;
    });
  }
  return { replaced, newContent };
}

function isTextFile(filePath) {
  try {
    const buf = fs.readFileSync(filePath, { encoding: 'utf8' });
    return true;
  } catch (e) {
    return false;
  }
}

function main() {
  const salt = process.env.SCRAMBLE_SALT || 'tillvalle-salt';
  const files = gitTrackedFiles();
  const toWrite = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!includeExt.has(ext)) continue;
    if (!fs.existsSync(f)) continue;
    if (!isTextFile(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    const { replaced, newContent } = scrambleContent(content, salt);
    if (replaced && newContent !== content) {
      toWrite.push({ f, newContent });
    }
  }

  if (toWrite.length === 0) {
    console.log('No keys detected to scramble.');
    process.exit(0);
    return;
  }

  // Write files
  for (const item of toWrite) {
    fs.writeFileSync(item.f, item.newContent, 'utf8');
    console.log('Scrambled keys in', item.f);
  }

  // Stage changes and create a commit
  try {
    execSync('git add --all');
    const msg = 'chore(secrets): scramble detected keys before push';
    execSync(`git commit -m "${msg}"`);
    console.log('Created scrub commit. Please review the commit before pushing if necessary.');
  } catch (e) {
    console.error('Failed to commit scrubbed changes. Please review and commit manually.', e.message || e);
    process.exit(2);
  }
}

if (require.main === module) main();
