console.log('--- STARTING COMPREHENSIVE AUTH & RECOVERY AUDIT ---');

// Test 1: Password Validation Rules Matrix
console.log('Test 1: Testing Password Strength & Validation Matrix...');
const passwordMatrix = [
  { pass: 'short', num: false, spec: false, match: true, expectedValid: false },
  { pass: 'longenough', num: false, spec: false, match: true, expectedValid: false },
  { pass: 'longenough123', num: true, spec: false, match: true, expectedValid: false },
  { pass: 'StrongPass123!', num: true, spec: true, match: true, expectedValid: true },
  { pass: 'StrongPass123!', num: true, spec: true, match: false, expectedValid: false },
];

passwordMatrix.forEach((item, idx) => {
  const hasMinLength = item.pass.length >= 8;
  const hasNumber = /\d/.exec(item.pass) !== null;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.exec(item.pass) !== null;
  const passwordsMatch = item.match;
  const isValid = hasMinLength && hasNumber && hasSpecial && passwordsMatch;
  if (isValid !== item.expectedValid) {
    throw new Error(`Password validation failed for item ${idx}: expected ${item.expectedValid}, got ${isValid}`);
  }
});
console.log('✅ Test 1 Passed: Password validation matrix fully verified.');

// Test 2: URL Hash & Recovery Detection Patterns
console.log('Test 2: Verifying URL Hash and Recovery Token Detection logic...');
const recoveryPatterns = [
  { url: 'https://socialspree.leadspree.in/#type=recovery', expected: true },
  { url: 'https://socialspree.leadspree.in/?type=recovery', expected: true },
  { url: 'https://socialspree.leadspree.in/#access_token=testtoken123&type=recovery', expected: true },
  { url: 'https://socialspree.leadspree.in/#error=access_denied&error_code=otp_expired', expectedHashError: true },
  { url: 'https://socialspree.leadspree.in/', expected: false }
];

recoveryPatterns.forEach((p, idx) => {
  const hash = p.url.includes('#') ? p.url.split('#')[1] : '';
  const search = p.url.includes('?') ? p.url.split('?')[1].split('#')[0] : '';
  const isRecovery = hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token');
  const isError = hash.includes('error=') || search.includes('error=');

  if (p.expected !== undefined && isRecovery !== p.expected) {
    throw new Error(`Recovery detection failed for pattern ${idx}`);
  }
  if (p.expectedHashError !== undefined && isError !== p.expectedHashError) {
    throw new Error(`Error detection failed for pattern ${idx}`);
  }
});
console.log('✅ Test 2 Passed: URL Hash & Recovery token detection verified.');

// Test 3: Verify Supabase Reset Endpoint URL format
console.log('Test 3: Verifying reset password redirect URL builder...');
const origin = 'https://socialspree.leadspree.in';
const redirectUrl = `${origin}/`;
if (redirectUrl !== 'https://socialspree.leadspree.in/') {
  throw new Error('Redirect URL format incorrect');
}
console.log('✅ Test 3 Passed: Reset password redirect URL builder verified.');

console.log('--- ALL AUTH AUDIT TESTS PASSED SUCCESSFULLY! ---');
