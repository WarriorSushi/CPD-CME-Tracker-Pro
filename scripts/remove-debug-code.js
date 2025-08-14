#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Production-safe replacements
const replacements = [
  // Remove standalone console.log statements
  {
    pattern: /^\s*console\.log\([^;]*\);\s*$/gm,
    replacement: ''
  },
  // Remove console.log within other statements
  {
    pattern: /console\.log\([^)]*\);\s*/g,
    replacement: ''
  },
  // Replace console.error with conditional
  {
    pattern: /console\.error\(/g,
    replacement: '__DEV__ && console.error('
  },
  // Remove devLog calls
  {
    pattern: /^\s*devLog\([^;]*\);\s*$/gm,
    replacement: ''
  },
  // Remove debug comments
  {
    pattern: /\/\/ DEBUG:.*$/gm,
    replacement: ''
  },
  // Remove TODO comments that are development-only
  {
    pattern: /\/\/ TODO: (?!.*PRODUCTION).*$/gm,
    replacement: ''
  }
];

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    replacements.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    
    // Remove multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript files in src directory
const srcDir = path.join(__dirname, '../src');

function findTSFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

console.log('🧹 Starting debug code cleanup...\n');

const tsFiles = findTSFiles(srcDir);
let cleanedCount = 0;

tsFiles.forEach(file => {
  if (cleanFile(file)) {
    cleanedCount++;
  }
});

console.log(`\n🎉 Debug cleanup complete!`);
console.log(`📊 Files processed: ${tsFiles.length}`);
console.log(`✨ Files cleaned: ${cleanedCount}`);

// Check for remaining console.log
try {
  const remaining = execSync(`grep -r "console\\.log" ${srcDir} || true`, { encoding: 'utf8' });
  if (remaining.trim()) {
    console.log('\n⚠️ Remaining console.log statements:');
    console.log(remaining);
  } else {
    console.log('\n✅ No console.log statements remaining!');
  }
} catch (error) {
  console.log('\n✅ Debug code cleanup verification complete');
}