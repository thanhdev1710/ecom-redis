import sensitive from "../data/sensitive.json";
import { advancedNormalize } from "../utils/normalize";

// Build a normalized set for fast lookup
const normalizedSensitiveSet: Set<string> = new Set(
  (sensitive.SENSITIVE_WORDS || []).map((w: string) => advancedNormalize(w)).filter((w: string) => !!w)
);

// Tokens that become ambiguous after removing diacritics, e.g. "vãi" -> "vai" (trùng với "vải")
const ambiguousNormalizedTokens = new Set<string>(["vai"]);

/**
 * Detect if the incoming message contains any sensitive/offensive words.
 * Returns the first matched word (normalized) or null if safe.
 */
export function detectSensitiveWord(message: string): string | null {
  const normalized = advancedNormalize(message);
  if (!normalized) return null;

  const words = normalized.split(" ").filter(Boolean);
  for (const word of words) {
    if (normalizedSensitiveSet.has(word)) {
      // If the token is ambiguous when de-accented (e.g., "vai"), require original to contain the accented offensive form
      if (ambiguousNormalizedTokens.has(word)) {
        const raw = message.toLowerCase();
        // Check accented offensive variants explicitly
        const accentedOffensiveVariants = ["vãi", "vãi ", " vãi", "vãi" /* basic presence */];
        const hit = accentedOffensiveVariants.some(v => raw.includes(v));
        if (!hit) continue; // skip false positive like "vải"
      }
      return word;
    }
  }
  // Also check phrase-level includes for multi-word entries
  for (const phrase of normalizedSensitiveSet) {
    if (phrase.includes(" ")) {
      if (normalized.includes(phrase)) return phrase;
    }
  }
  return null;
}


