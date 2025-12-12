#!/usr/bin/env tsx

/**
 * Accessibility Checker Script
 * Runs automated accessibility checks
 */

import { checkCommonColors } from '../lib/accessibility/contrast-checker';

console.log('🔍 Running Accessibility Checks...\n');

// Check color contrast
console.log('📊 Color Contrast Check:\n');
const colorResults = checkCommonColors();

let aaPasses = 0;
let aaFails = 0;
let aaaPasses = 0;
let aaaFails = 0;

colorResults.forEach((result) => {
  const textType = result.isLargeText ? 'Large Text' : 'Normal Text';
  const statusAA = result.passesAA ? '✅' : '❌';
  const statusAAA = result.passesAAA ? '✅' : '❌';

  if (result.passesAA) aaPasses++;
  else aaFails++;

  if (result.passesAAA) aaaPasses++;
  else aaaFails++;

  console.log(`${statusAA} ${statusAAA} ${textType}: ${result.foreground} on ${result.background}`);
  console.log(`   Ratio: ${result.ratio?.toFixed(2) || 'N/A'}`);
  console.log(
    `   WCAG AA: ${result.passesAA ? 'PASS' : 'FAIL'} (required: ${result.isLargeText ? '3.0' : '4.5'})`
  );
  console.log(
    `   WCAG AAA: ${result.passesAAA ? 'PASS' : 'FAIL'} (required: ${result.isLargeText ? '4.5' : '7.0'})`
  );
  console.log('');
});

console.log('\n📈 Summary:');
console.log(`   WCAG AA: ${aaPasses} passed, ${aaFails} failed`);
console.log(`   WCAG AAA: ${aaaPasses} passed, ${aaaFails} failed`);

if (aaFails > 0) {
  console.log('\n⚠️  Some color combinations do not meet WCAG AA standards.');
  console.log('   Please review and fix the failing combinations.');
  process.exit(1);
} else {
  console.log('\n✅ All color combinations meet WCAG AA standards!');
  process.exit(0);
}
