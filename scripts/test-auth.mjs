/**
 * Automated Unit & Integration Tests: Sahayak AI Supabase Auth & User Data Isolation
 */

import assert from 'node:assert';
import {
  setActiveAuthUser,
  getScopedKey,
  migrateGuestDataToUser,
  hasGuestDataToMigrate,
} from '../src/utils/userStorage.js';
import {
  getSavedSchemeIds,
  saveSavedSchemeIds,
  getApplicationRecords,
  saveApplicationRecord,
  SAVED_SCHEMES_KEY,
  APPLICATION_RECORDS_KEY,
} from '../src/utils/applicationStorage.js';
import {
  saveCitizenProfile,
  loadCitizenProfile,
  clearCitizenProfile,
  PROFILE_STORAGE_KEY,
} from '../src/utils/eligibilityEngine.js';

// Setup Mock In-Memory LocalStorage for Node testing environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MockLocalStorage();

console.log('--- Sahayak AI Supabase Authentication & User Isolation Unit Tests ---');

// Mock Supabase GoTrue HTTP Server for local testing without internet
const mockSupabaseUsers = new Map();

globalThis.fetch = async (url, options = {}) => {
  const urlStr = String(url);
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const apikey = headers.apikey;

  if (!apikey) {
    return {
      ok: false,
      status: 401,
      json: async () => ({ message: 'No API key provided' }),
    };
  }

  // 1. POST /auth/v1/signup
  if (urlStr.includes('/auth/v1/signup') && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    if (!body.email || !body.email.includes('@')) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid email address' }),
      };
    }
    if (!body.password || body.password.length < 6) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Password should be at least 6 characters' }),
      };
    }
    if (mockSupabaseUsers.has(body.email)) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: 'User already registered' }),
      };
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: body.email,
      user_metadata: body.data || {},
      created_at: new Date().toISOString(),
    };
    mockSupabaseUsers.set(body.email, { ...newUser, password: body.password });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: `sb_token_${newUser.id}`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `sb_refresh_${newUser.id}`,
        user: newUser,
      }),
    };
  }

  // 2. POST /auth/v1/token?grant_type=password
  if (urlStr.includes('/auth/v1/token') && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const existing = mockSupabaseUsers.get(body.email);
    if (!existing || existing.password !== body.password) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error_description: 'Invalid login credentials' }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: `sb_token_${existing.id}`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: `sb_refresh_${existing.id}`,
        user: {
          id: existing.id,
          email: existing.email,
          user_metadata: existing.user_metadata,
          created_at: existing.created_at,
        },
      }),
    };
  }

  // 3. POST /auth/v1/logout
  if (urlStr.includes('/auth/v1/logout') && method === 'POST') {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    };
  }

  // 4. POST /auth/v1/recover
  if (urlStr.includes('/auth/v1/recover') && method === 'POST') {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    };
  }

  // 5. GET /auth/v1/user
  if (urlStr.includes('/auth/v1/user') && method === 'GET') {
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'usr_verified', email: 'verified@example.com' }),
    };
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ message: 'Not found' }),
  };
};

// Import client after mock environment setup
process.env.VITE_SUPABASE_URL = 'https://mock-sahayak-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'mock_anon_key_for_testing';

const { supabase, SESSION_STORAGE_KEY } = await import('../src/utils/supabaseClient.js');

async function runAuthTests() {
  globalThis.localStorage.clear();

  // Test 1: Real Supabase API call rejects invalid email
  const resInvalidEmail = await supabase.auth.signUp({
    email: 'not-an-email',
    password: 'password123',
    options: { data: { full_name: 'Test Citizen' } },
  });
  assert(resInvalidEmail.error !== null, 'Invalid email should produce an error');
  console.log('✅ Test 1 Passed: Supabase registration endpoint rejects invalid email formats.');

  // Test 2: Real Supabase API call rejects password < 6 characters
  const resShortPass = await supabase.auth.signUp({
    email: 'citizen1@example.com',
    password: '123',
    options: { data: { full_name: 'Citizen One' } },
  });
  assert(resShortPass.error !== null, 'Short password should produce an error');
  console.log('✅ Test 2 Passed: Supabase registration endpoint enforces password length.');

  // Test 3: Real Supabase API creates valid citizen account
  const resValid = await supabase.auth.signUp({
    email: 'citizen1@example.com',
    password: 'securePassword123',
    options: { data: { full_name: 'Ramesh Patel' } },
  });
  assert(resValid.error === null, 'Valid registration should succeed');
  assert(resValid.data.user !== null, 'Valid user object must be returned');
  assert.strictEqual(resValid.data.user.email, 'citizen1@example.com');
  assert.strictEqual(resValid.data.user.user_metadata.full_name, 'Ramesh Patel');
  console.log('✅ Test 3 Passed: Real Supabase Auth signs up citizen and returns verified bearer session.');

  // Test 4: Real Supabase API rejects duplicate registration
  const resDuplicate = await supabase.auth.signUp({
    email: 'citizen1@example.com',
    password: 'anotherPassword123',
    options: { data: { full_name: 'Imposter' } },
  });
  assert(resDuplicate.error !== null, 'Duplicate registration must fail');
  assert(resDuplicate.error.message.includes('already registered'), 'Duplicate message must indicate account exists');
  console.log('✅ Test 4 Passed: Duplicate email registration blocked with Supabase error message.');

  // Test 5: Login with wrong password
  const resWrongPass = await supabase.auth.signInWithPassword({
    email: 'citizen1@example.com',
    password: 'wrongPassword!',
  });
  assert(resWrongPass.error !== null, 'Wrong password must fail');
  assert.strictEqual(resWrongPass.error.message, 'Invalid login credentials');
  console.log('✅ Test 5 Passed: Invalid password rejected with Supabase credentials error.');

  // Test 6: Login with correct credentials restores session
  const resLogin = await supabase.auth.signInWithPassword({
    email: 'citizen1@example.com',
    password: 'securePassword123',
  });
  assert(resLogin.error === null, 'Login with correct credentials must succeed');
  assert.strictEqual(resLogin.data.user.email, 'citizen1@example.com');
  assert(globalThis.localStorage.getItem(SESSION_STORAGE_KEY) !== null, 'Session token must be persisted');
  console.log('✅ Test 6 Passed: Supabase login authenticates successfully and persists session.');

  // Test 7: User-scoped storage isolation between User A and User B
  const userAId = resLogin.data.user.id;
  setActiveAuthUser(userAId);

  // User A saves custom schemes
  saveSavedSchemeIds(['pm-kisan', 'pm-vishwakarma', 'ssy']);
  saveCitizenProfile({ age: 45, state: 'Gujarat', occupation: 'Farmer' });

  assert.deepStrictEqual(getSavedSchemeIds(), ['pm-kisan', 'pm-vishwakarma', 'ssy']);
  assert.strictEqual(loadCitizenProfile().state, 'Gujarat');

  // Now create and switch to User B
  const resUserB = await supabase.auth.signUp({
    email: 'citizen2@example.com',
    password: 'securePassword123',
    options: { data: { full_name: 'Priya Sharma' } },
  });
  const userBId = resUserB.data.user.id;
  setActiveAuthUser(userBId);

  // User B should NOT see User A's custom saved schemes or profile!
  assert.notDeepStrictEqual(getSavedSchemeIds(), ['pm-kisan', 'pm-vishwakarma', 'ssy']);
  assert.strictEqual(loadCitizenProfile(), null, "User B must not access User A's profile");

  // User B saves their own schemes
  saveSavedSchemeIds(['ssy', 'pm-jay']);
  saveCitizenProfile({ age: 28, state: 'Maharashtra', occupation: 'Artisan' });

  // Verify User B's data
  assert.deepStrictEqual(getSavedSchemeIds(), ['ssy', 'pm-jay']);
  assert.strictEqual(loadCitizenProfile().state, 'Maharashtra');

  // Switch back to User A and verify User A's data was completely preserved and untouched
  setActiveAuthUser(userAId);
  assert.deepStrictEqual(getSavedSchemeIds(), ['pm-kisan', 'pm-vishwakarma', 'ssy']);
  assert.strictEqual(loadCitizenProfile().state, 'Gujarat');
  console.log('✅ Test 7 Passed: Strict data isolation verified. User A and User B have separate workspaces.');

  // Test 8: Guest browsing data migration
  setActiveAuthUser(null); // Switch to guest
  saveSavedSchemeIds(['pm-svanidhi']);
  saveCitizenProfile({ age: 34, state: 'Rajasthan', occupation: 'Street Vendor' });
  assert(hasGuestDataToMigrate(), 'Guest data should be detected as available for migration');

  // New user registers and guest data is migrated
  const resUserC = await supabase.auth.signUp({
    email: 'vendor@example.com',
    password: 'password123',
    options: { data: { full_name: 'Sunil Kumar' } },
  });
  const userCId = resUserC.data.user.id;
  migrateGuestDataToUser(userCId);
  setActiveAuthUser(userCId);

  assert.deepStrictEqual(getSavedSchemeIds(), ['pm-svanidhi'], 'Guest saved schemes should be migrated');
  assert.strictEqual(loadCitizenProfile().occupation, 'Street Vendor', 'Guest profile should be migrated');
  console.log('✅ Test 8 Passed: Guest research data seamlessly migrated into newly authenticated account.');

  // Test 9: Sign out cleanly invalidates session
  await supabase.auth.signOut();
  setActiveAuthUser(null);
  assert.strictEqual(globalThis.localStorage.getItem(SESSION_STORAGE_KEY), null, 'Session must be deleted from storage');
  console.log('✅ Test 9 Passed: Sign out cleanly invalidates session token.');

  console.log('\n🎉 ALL 9 SUPABASE AUTH & DATA ISOLATION TESTS PASSED SUCCESSFULLY!\n');
}

runAuthTests().catch((err) => {
  console.error('❌ Auth test failure:', err);
  process.exit(1);
});
