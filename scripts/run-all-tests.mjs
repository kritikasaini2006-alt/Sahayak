import { execSync } from 'child_process';

const testSuites = [
  { name: 'Eligibility & Rules Matching', path: 'scripts/test-eligibility.mjs' },
  { name: 'Documents & Application Guidance', path: 'scripts/test-guidance.mjs' },
  { name: 'Saved Schemes & Applications Storage', path: 'scripts/test-applications.mjs' },
  { name: 'Chatbot Backend & Rate Limiting', path: 'scripts/test-chat.mjs' },
  { name: 'Interactive Guided Assistant & Structured Flow', path: 'scripts/test-guided-assistant.mjs' },
  { name: 'Authentication & User Data Isolation', path: 'scripts/test-auth.mjs' },
  { name: 'Navbar UI/UX & Responsive Breakpoints', path: 'scripts/test-navbar.mjs' },
  { name: 'Bilingual System & i18n Dictionary Parity', path: 'scripts/test-i18n.mjs' },
  { name: 'Microphone Interaction & Permission Guidance Modal', path: 'scripts/test-microphone.mjs' },
  { name: 'Discover Schemes Layout & Empty-State Stability', path: 'scripts/test-schemes-layout.mjs' },
  { name: 'Immediate Language Switching & Chat Translation', path: 'scripts/test-immediate-language-switch.mjs' },
  { name: 'Persistent Chat History & New Chat', path: 'scripts/test-persistent-chat.mjs' },
];

console.log('====================================================');
console.log('    Sahayak AI Master Automated Test Runner         ');
console.log('====================================================\n');

let totalPassed = 0;
let totalFailed = 0;

for (const suite of testSuites) {
  console.log(`▶ Running Suite: ${suite.name} (${suite.path})`);
  try {
    const output = execSync(`node ${suite.path}`, { stdio: 'inherit' });
    totalPassed++;
    console.log(`✔ Suite Completed: ${suite.name}\n`);
  } catch (err) {
    totalFailed++;
    console.error(`✘ Suite Failed: ${suite.name}\n`);
  }
}

console.log('====================================================');
console.log(`Test Execution Summary: ${totalPassed} Passed, ${totalFailed} Failed.`);
console.log('====================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL TEST SUITES COMPLETED WITH 100% SUCCESS!\n');
}

