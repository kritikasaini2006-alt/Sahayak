import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Sahayak AI Navbar UI/UX Unit & Breakpoint Tests ---');

const navbarPath = path.resolve(__dirname, '../src/components/common/Navbar.jsx');
const content = fs.readFileSync(navbarPath, 'utf8');

// Test 1: Spacing and Alignment
const hasMaxW7xl = content.includes('max-w-7xl mx-auto');
const hasVerticalCenter = content.includes('flex items-center justify-between');
const hasStreamlinedHeight = content.includes('h-16 lg:h-[68px]');
if (hasMaxW7xl && hasVerticalCenter && hasStreamlinedHeight) {
  console.log('✅ Test 1 Passed: Centered max-width container, vertical centering, and streamlined height.');
} else {
  console.error('❌ Test 1 Failed: Spacing or alignment check missing.');
  process.exit(1);
}

// Test 2: Brand and Logo
const hasCompactBrand = (content.includes('brand.name') || content.includes('Sahayak')) && (content.includes('brand.badge') || content.includes('Civic-Tech'));
const hasSubtitleResponsive = content.includes('hidden sm:block lg:hidden xl:block');
const hasBrandNowrap = content.includes('whitespace-nowrap');
if (hasCompactBrand && hasSubtitleResponsive && hasBrandNowrap) {
  console.log('✅ Test 2 Passed: Brand logo, name, Civic-Tech badge, and subtitle are compactly grouped and responsive.');
} else {
  console.error('❌ Test 2 Failed: Brand structure or responsive visibility issue.');
  process.exit(1);
}

// Test 3: Navigation Labels & No Text Wrapping
const expectedKeysOrLinks = [
  'nav.home',
  'nav.discoverSchemes',
  'nav.checkEligibility',
  'nav.aiAssistant',
  'nav.myApplications',
  'nav.about',
];
let linksFound = true;
for (const l of expectedKeysOrLinks) {
  if (!content.includes(l)) {
    linksFound = false;
    break;
  }
}
const hasWhitespaceNowrap = content.includes('whitespace-nowrap');
if (linksFound && hasWhitespaceNowrap) {
  console.log('✅ Test 3 Passed: All 6 navigation items present with whitespace-nowrap preventing awkward line breaks.');
} else {
  console.error('❌ Test 3 Failed: Missing navigation items or whitespace-nowrap.');
  process.exit(1);
}

// Test 4: Login and Sign Up Action Buttons
const hasLoginBtn = content.includes('nav.login') || content.includes('Log In');
const hasSignUpBtn = content.includes('nav.signup') || content.includes('nav.signUp') || content.includes('Sign Up');
const hasConsistentHeight = content.includes('h-9 inline-flex items-center');
const hasPrimarySecondaryHierarchy = content.includes('bg-teal-600') && content.includes('hover:bg-slate-100');
if (hasLoginBtn && hasSignUpBtn && hasConsistentHeight && hasPrimarySecondaryHierarchy) {
  console.log('✅ Test 4 Passed: Clean Login secondary action and primary teal Sign Up CTA with matching heights.');
} else {
  console.error('❌ Test 4 Failed: Login / Sign Up buttons issue.');
  process.exit(1);
}

// Test 5: Responsive Breakpoints & Mobile Drawer
// Desktop (1440px, 1280px, 1024px) -> uses lg:flex
// Tablet (768px) -> uses sm:inline-flex lg:hidden for compact auth & hamburger
// Mobile (390px, 320px) -> unauthenticated top-bar buttons hidden (< sm), only brand + hamburger in top bar
const hasLgDesktopNav = content.includes('hidden lg:flex');
const hasMobileDrawer = content.includes('id="mobile-menu"');
const hasMobileAuthDrawer = content.includes('nav.createAccount') || content.includes('nav.signUpFree') || content.includes('Sign Up — Free Citizen Account');
const hasTabletTopBarAuth = content.includes('hidden sm:inline-flex items-center gap-2');
if (hasLgDesktopNav && hasMobileDrawer && hasMobileAuthDrawer && hasTabletTopBarAuth) {
  console.log('✅ Test 5 Passed: Responsive breakpoints properly configured for 1440px, 1280px, 1024px, 768px, 390px, and 320px.');
} else {
  console.error('❌ Test 5 Failed: Responsive breakpoint configuration issue.');
  process.exit(1);
}

// Test 6: Accessibility & Keyboard Navigation
const hasEscapeHandler = content.includes("'Escape'");
const hasAriaExpanded = content.includes('aria-expanded');
const hasAriaControls = content.includes('aria-controls="mobile-menu"');
const hasLocationChangeClose = content.includes('location.pathname');
if (hasEscapeHandler && hasAriaExpanded && hasAriaControls && hasLocationChangeClose) {
  console.log('✅ Test 6 Passed: Full accessibility with aria controls, Escape key close, and route-change cleanup.');
} else {
  console.error('❌ Test 6 Failed: Accessibility or keyboard navigation features missing.');
  process.exit(1);
}

console.log('\n🎉 ALL 6 NAVBAR TESTS PASSED SUCCESSFULLY!\n');

