/**
 * Authentication-related constants
 */

/** Storage keys for auth-related data */
export const AUTH_KEYS = {
  /** Key for storing persistence preference */
  PERSIST: "@auth:persist",
  /** Key for storing session data */
  SESSION: "@auth:session",
  /** Key for storing theme preference */
  THEME: "@auth:theme",
} as const;

/** Type for AUTH_KEYS values */
export type AuthKey = (typeof AUTH_KEYS)[keyof typeof AUTH_KEYS];
