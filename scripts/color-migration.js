// Color Migration Script - Systematic HEX to HSL Token Replacement
// This implements the codemod approach specified in the color overhaul requirements

const fs = require('fs');
const path = require('path');

// HEX to Token mapping as specified
const COLOR_MAPPINGS = {
  '#FFFFFF': "getColor('white')",
  '#000000': "getColor('black')",
  '#F9FAFB': "getColor('gray50')",
  '#F3F4F6': "getColor('gray100')",
  '#E5E7EB': "getColor('gray200')",
  '#D1D5DB': "getColor('gray300')",
  '#9CA3AF': "getColor('gray400')",
  '#6B7280': "getColor('gray500')",
  '#4B5563': "getColor('gray600')",
  '#374151': "getColor('gray700')",
  '#1F2937': "getColor('gray800')",
  '#111827': "getColor('gray900')",
  '#0066CC': "getColor('primary')",
  '#004A99': "getColor('primaryDark')",
  '#3385D6': "getColor('primaryLight')",
  '#10B981': "getColor('success')",
  '#F59E0B': "getColor('warningBorder')",
  '#EF4444': "getColor('error')",
  '#3B82F6': "getColor('info')",
  '#E6F0FA': "getColor('selectedBg')",
  '#FFF7ED': "getColor('warningBg')",
  '#92400E': "getColor('warningText')",
};

// Special patterns to replace
const SPECIAL_PATTERNS = {
  // Replace "selected with 10% opacity" patterns
  "#0066CC + '10'": "getColor('selectedBg')",
  "theme.colors.primary + '10'": "getColor('selectedBg')",
  "theme.colors.primary + '15'": "getColor('selectedBg')",
};

// Files to exclude from migration
const EXCLUDE_FILES = [
  'src/theme/',
  'src/scripts/',
  'node_modules/',
  '.git/',
];

// Track unknown colors for manual review
let unknownColors = [];

function shouldExcludeFile(filePath) {
  return EXCLUDE_FILES.some(exclude => filePath.includes(exclude));
}

function migrateColors(content, filePath) {
  let modified = false;
  let newContent = content;

  // First, replace special patterns
  Object.entries(SPECIAL_PATTERNS).forEach(([pattern, replacement]) => {
    if (newContent.includes(pattern)) {
      newContent = newContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      modified = true;
    }
  });

  // Then replace direct HEX values
  Object.entries(COLOR_MAPPINGS).forEach(([hex, replacement]) => {
    // Create regex to match hex in various contexts (quotes, property values, etc.)
    const hexRegex = new RegExp(`(['"\`]?)${hex.replace('#', '#')}\\1`, 'gi');
    
    if (hexRegex.test(newContent)) {
      newContent = newContent.replace(hexRegex, replacement);
      modified = true;
    }
  });

  // Find unknown hex colors for manual review
  const hexPattern = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
  const foundHexes = newContent.match(hexPattern);
  
  if (foundHexes) {
    foundHexes.forEach(hex => {
      const normalizedHex = hex.toUpperCase();
      if (!COLOR_MAPPINGS[normalizedHex] && !unknownColors.some(item => item.hex === normalizedHex)) {
        unknownColors.push({ hex: normalizedHex, file: filePath });
      }
    });
  }

  // Add getColor import if colors were replaced and import doesn't exist
  if (modified && !newContent.includes("import { getColor }") && !newContent.includes("useColors")) {
    // Add import after existing imports
    const importMatch = newContent.match(/^(import.*?from.*?;)$/gm);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const importIndex = newContent.indexOf(lastImport) + lastImport.length;
      newContent = newContent.slice(0, importIndex) + 
        "\nimport { getColor } from '../theme';" + 
        newContent.slice(importIndex);
    }
  }

  return { content: newContent, modified };
}

function processFile(filePath) {
  if (shouldExcludeFile(filePath) || !filePath.match(/\.(ts|tsx|js|jsx)$/)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = migrateColors(content, filePath);
    
    if (result.modified) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ Migrated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

// Run migration
console.log('🚀 Starting color migration...\n');

const srcPath = path.join(__dirname, '../src');
processDirectory(srcPath);

// Write unknown colors report
if (unknownColors.length > 0) {
  const reportPath = path.join(__dirname, 'colors-unknown.txt');
  const report = unknownColors.map(item => `${item.hex} in ${item.file}`).join('\n');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n⚠️  Found ${unknownColors.length} unknown colors. See: ${reportPath}`);
} else {
  console.log('\n✅ All colors migrated successfully!');
}

console.log('\n🎉 Color migration complete!');