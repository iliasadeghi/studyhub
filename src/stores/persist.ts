/**
 * Shared persistence config. Bump STORE_VERSION when a persisted shape changes and
 * add a migration in the relevant store's `migrate` option.
 */
export const STORE_VERSION = 1;

export const storageKey = (name: string) => `studyhub:${name}`;
