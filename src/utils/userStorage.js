/**
 * User-Scoped Storage & Migration Utility for Sahayak AI
 *
 * Ensures:
 * 1. User Data Isolation: Every authenticated citizen has isolated records
 *    keyed by their Supabase User ID (e.g., sahayak_saved_schemes_{userId}).
 * 2. Guest Preservation: Guests browse freely using un-scoped keys.
 * 3. Seamless Continuation: When a guest logs in, their current guest research
 *    (saved schemes, application records, profile) can be seamlessly imported
 *    into their personal account so no work is lost.
 */

import {
  SAVED_SCHEMES_KEY,
  APPLICATION_RECORDS_KEY,
  CHECKLIST_STORAGE_KEY,
  safeJsonParse,
} from './applicationStorage.js';
import { PROFILE_STORAGE_KEY } from './eligibilityEngine.js';

let currentAuthUserId = null;

/**
 * Sets the currently active authenticated user ID.
 * When null, functions operate in 'guest' mode.
 */
export function setActiveAuthUser(userId) {
  currentAuthUserId = userId || null;
}

export function getActiveAuthUser() {
  return currentAuthUserId;
}

/**
 * Returns the scoped storage key for a given base key.
 */
export function getScopedKey(baseKey, userId = currentAuthUserId) {
  if (!userId) return baseKey; // Guest uses standard base key
  return `${baseKey}_${userId}`;
}

/**
 * Checks if the guest session has data that can be migrated to a new user account.
 */
export function hasGuestDataToMigrate() {
  if (typeof localStorage === 'undefined') return false;
  try {
    const rawSaved = localStorage.getItem(SAVED_SCHEMES_KEY);
    const rawApps = localStorage.getItem(APPLICATION_RECORDS_KEY);
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

    const saved = safeJsonParse(rawSaved, []);
    const apps = safeJsonParse(rawApps, []);
    const profile = safeJsonParse(rawProfile, null);

    const hasSaved = Array.isArray(saved) && saved.length > 0;
    const hasApps = Array.isArray(apps) && apps.length > 0;
    const hasProfile = Boolean(profile && (profile.age || profile.state || profile.occupation));

    return hasSaved || hasApps || hasProfile;
  } catch {
    return false;
  }
}

/**
 * Migrates guest research into the user's isolated account storage.
 */
export function migrateGuestDataToUser(userId) {
  if (!userId || typeof localStorage === 'undefined') return false;

  try {
    const guestSaved = safeJsonParse(localStorage.getItem(SAVED_SCHEMES_KEY), null);
    const guestApps = safeJsonParse(localStorage.getItem(APPLICATION_RECORDS_KEY), null);
    const guestProfile = safeJsonParse(localStorage.getItem(PROFILE_STORAGE_KEY), null);
    const guestChecklists = safeJsonParse(localStorage.getItem(CHECKLIST_STORAGE_KEY), null);

    const userSavedKey = getScopedKey(SAVED_SCHEMES_KEY, userId);
    const userAppsKey = getScopedKey(APPLICATION_RECORDS_KEY, userId);
    const userProfileKey = getScopedKey(PROFILE_STORAGE_KEY, userId);
    const userChecklistKey = getScopedKey(CHECKLIST_STORAGE_KEY, userId);

    // Only populate if user store doesn't already have its own records
    if (guestSaved && !localStorage.getItem(userSavedKey)) {
      localStorage.setItem(userSavedKey, JSON.stringify(guestSaved));
    }

    if (guestApps && !localStorage.getItem(userAppsKey)) {
      // Re-assign userId on imported application records
      const migratedApps = Array.isArray(guestApps)
        ? guestApps.map((app) => ({ ...app, userId }))
        : [];
      localStorage.setItem(userAppsKey, JSON.stringify(migratedApps));
    }

    if (guestProfile && !localStorage.getItem(userProfileKey)) {
      localStorage.setItem(userProfileKey, JSON.stringify(guestProfile));
    }

    if (guestChecklists && !localStorage.getItem(userChecklistKey)) {
      localStorage.setItem(userChecklistKey, JSON.stringify(guestChecklists));
    }

    return true;
  } catch (error) {
    console.error('Failed to migrate guest data to user account:', error);
    return false;
  }
}
