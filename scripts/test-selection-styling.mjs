import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Sahayak AI Text Selection & Copy Styling Unit Tests ---\n');

// 1. Check src/index.css
const indexCssPath = path.resolve(__dirname, '../src/index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');

console.log('▶ Test 1: Global ::selection and ::-moz-selection in index.css');
assert(indexCss.includes('::selection'), 'index.css must include ::selection pseudo-element');
assert(indexCss.includes('::-moz-selection'), 'index.css must include ::-moz-selection for Firefox compatibility');
assert(/::selection\s*\{\s*background-color:\s*#0D9488;\s*color:\s*#FFFFFF;/i.test(indexCss), '::selection must define #0D9488 background and #FFFFFF text');
assert(/::-moz-selection\s*\{\s*background-color:\s*#0D9488;\s*color:\s*#FFFFFF;/i.test(indexCss), '::-moz-selection must define #0D9488 background and #FFFFFF text');
console.log('✅ Test 1 Passed: Global CSS ::selection and ::-moz-selection rules configured with #0D9488 and #FFFFFF.');

// 2. Check src/components/layout/AppLayout.jsx
const appLayoutPath = path.resolve(__dirname, '../src/components/layout/AppLayout.jsx');
const appLayout = fs.readFileSync(appLayoutPath, 'utf8');

console.log('▶ Test 2: AppLayout selection styling and elimination of yellow highlight');
assert(!appLayout.includes('selection:bg-amber-100'), 'AppLayout must NOT contain yellow selection:bg-amber-100');
assert(!appLayout.includes('selection:text-amber-900'), 'AppLayout must NOT contain dark yellow selection:text-amber-900');
assert(appLayout.includes('selection:bg-[#0D9488]'), 'AppLayout must define teal-green selection:bg-[#0D9488]');
assert(appLayout.includes('selection:text-white'), 'AppLayout must define high-contrast selection:text-white');
console.log('✅ Test 2 Passed: AppLayout uses teal-green #0D9488 with white text, and yellow amber styles are completely eliminated.');

// 3. Check index.html
const indexHtmlPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

console.log('▶ Test 3: Root index.html body selection styling');
assert(indexHtml.includes('selection:bg-[#0D9488]'), 'index.html body must include selection:bg-[#0D9488]');
assert(indexHtml.includes('selection:text-white'), 'index.html body must include selection:text-white');
console.log('✅ Test 3 Passed: index.html body styling matches Sahayak AI teal theme.');

// 4. Check for any conflicting or residual amber/yellow selection styles in src/
console.log('▶ Test 4: Verify zero residual yellow/amber selection styles across all components');
const srcDir = path.resolve(__dirname, '../src');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkDir(fullPath);
    } else if (/\.(jsx?|tsx?|css|html)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert(!content.includes('selection:bg-amber'), `File ${fullPath} has lingering selection:bg-amber`);
      assert(!content.includes('selection:bg-yellow'), `File ${fullPath} has lingering selection:bg-yellow`);
    }
  }
}
checkDir(srcDir);
console.log('✅ Test 4 Passed: Zero residual yellow/amber selection styles across all source files.');

console.log('\n🎉 ALL 4 TEXT SELECTION STYLING TESTS PASSED WITH 100% SUCCESS!\n');

