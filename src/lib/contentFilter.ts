// Client-side content filter for user-generated text.
//
// Apple Guideline 1.2 requires UGC apps to have "a method for filtering
// objectionable material from being posted." This module is the first line
// of defense — it runs before insert in createCheckIn (and before submit in
// the check-in UI). The reporting + blocking flows handle anything that
// slips through.
//
// Conservative on purpose: false positives ruin first-time-user trust more
// than false negatives, since real reviewers can also report. We catch the
// obvious junk (slurs, URL spam, character spam, runaway length) and let
// the human moderation queue handle judgment calls.

const MAX_LENGTH = 1000;

// Hard-blocked tokens. Lowercased; matched as whole-word substrings on the
// normalized input. Intentionally short — keep this list to obvious slurs
// and the most common spammer signatures, not general profanity.
const BANNED_WORDS: string[] = [
  // English slurs (truncated stems to catch leetspeak variants)
  'nigger', 'nigga', 'faggot', 'kike', 'chink', 'spic', 'gook', 'tranny',
  'retard', 'retarded',
  // Common spam vectors
  'viagra', 'porn', 'xxx',
  // Chinese
  '操你', '草你', '傻逼', '日你妈', '你妈死', '法轮功',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    // strip combining marks (e.g. ñ → n) so " nĩgger " can't slip through
    .replace(/[̀-ͯ]/g, '')
    // collapse zero-width chars used to break word matches
    .replace(/[​-‍﻿]/g, '');
}

// Aggressively collapse text down to a bare alphanumeric/CJK signature for
// banned-word matching. This defeats the common evasion tricks the plain
// `normalize()` misses: spacing ("n i g g e r"), punctuation ("n.i.g.g.e.r"),
// and leetspeak ("n1gg3r", "f@ggot"). We match banned words against BOTH the
// readable normalized form and this collapsed form so a hit on either rejects.
const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '@': 'a', '$': 's', '!': 'i', '|': 'i',
};

function collapseForMatch(normalized: string): string {
  return normalized
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    // keep latin letters, digits-as-letters already mapped, and CJK; drop the rest
    .filter((ch) => /[a-z0-9一-鿿]/.test(ch))
    .join('');
}

export interface ContentCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Validate user-posted text before persistence. Returns ok:true when the
 * text is acceptable, or ok:false with a user-facing reason string when it
 * should be rejected. The reason is safe to surface in the UI.
 */
export function validateUserText(
  text: string,
  opts: { fieldName?: string; allowEmpty?: boolean } = {}
): ContentCheckResult {
  const field = opts.fieldName ?? 'Text';
  const trimmed = text.trim();

  if (!trimmed) {
    return opts.allowEmpty
      ? { ok: true }
      : { ok: false, reason: `${field} can’t be empty.` };
  }

  // Count by code points so emoji / CJK (which span multiple UTF-16 units)
  // aren't penalized — this app's audience writes emoji- and CJK-heavy reviews.
  if ([...trimmed].length > MAX_LENGTH) {
    return {
      ok: false,
      reason: `${field} is too long (max ${MAX_LENGTH} characters).`,
    };
  }

  const normalized = normalize(trimmed);
  const collapsed = collapseForMatch(normalized);

  // URLs in user reviews are almost always spam; refer them to a proper
  // restaurant submission flow instead of allowing freeform links.
  if (/(https?:\/\/|www\.)\S{2,}/i.test(normalized)) {
    return {
      ok: false,
      reason: `${field} can’t contain links. Describe the restaurant in your own words.`,
    };
  }

  // Character spam: any single character repeated 10+ times in a row.
  if (/(.)\1{9,}/u.test(trimmed)) {
    return {
      ok: false,
      reason: `${field} looks like spam. Please write a real review.`,
    };
  }

  for (const word of BANNED_WORDS) {
    // Match against the readable form and the collapsed (de-leeted, de-spaced)
    // form so "n i g g e r" and "n1gg3r" are caught alongside the plain word.
    if (normalized.includes(word) || collapsed.includes(collapseForMatch(word))) {
      return {
        ok: false,
        reason:
          'Your text contains language that violates our community guidelines. Please revise and try again.',
      };
    }
  }

  return { ok: true };
}

/**
 * Shorthand to throw a friendly Error if validation fails. Use this in
 * service-layer write paths where you want the caller's existing
 * try/catch to surface the message.
 */
export function assertCleanText(
  text: string,
  opts?: { fieldName?: string; allowEmpty?: boolean }
): void {
  const result = validateUserText(text, opts);
  if (!result.ok) {
    throw new Error(result.reason);
  }
}
