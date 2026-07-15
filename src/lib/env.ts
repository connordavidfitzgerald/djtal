import { getSecret } from 'astro:env/server';

/**
 * Read a runtime env var that works everywhere:
 * - local dev: Astro loads it from `.env` (process.env is NOT populated there)
 * - production: from the host's real environment
 *
 * `getSecret` handles both; we fall back to process.env just in case.
 */
export function readEnv(key: string): string | undefined {
    let value: string | undefined;
    try {
        value = getSecret(key) ?? undefined;
    } catch {
        value = undefined;
    }
    return value && value !== '' ? value : process.env[key];
}
