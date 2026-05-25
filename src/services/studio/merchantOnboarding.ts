// ============================================================================
// CraveMap Studio — merchant onboarding service
// ============================================================================
// Writes a merchant_profiles row and an initial restaurant_menu_sources row.
// Always uses Supabase directly (Studio has no mock mode — it requires auth).
// ============================================================================

import { getSupabaseClient } from '../../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MerchantOnboardingInput {
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  cuisineType: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  instagramUrl?: string;
  /** Required — raw text pasted from a menu. */
  menuText: string;
  /** Optional — pasted customer review snippets. Appended to the menu source. */
  reviewSnippets?: string;
  targetCustomers: string[];
}

export interface MerchantOnboardingResult {
  merchantProfileId: string;
  menuSourceId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
    );
  }
  return client;
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error — check your connection and try again.';
  }
  if (lower.includes('permission') || lower.includes('policy') || lower.includes('rls')) {
    return 'Permission error — please make sure you are signed in.';
  }
  if (lower.includes('duplicate') || lower.includes('unique')) {
    return 'A profile for this account already exists.';
  }
  return message || 'Something went wrong. Please try again.';
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Save merchant onboarding data.
 * 1. Upserts merchant_profiles (keyed on user_id) so re-submitting is safe.
 * 2. Always inserts a new restaurant_menu_sources row so each submission is
 *    preserved as a versioned source for AI analysis.
 */
export async function saveMerchantOnboarding(
  userId: string,
  input: MerchantOnboardingInput,
): Promise<MerchantOnboardingResult> {
  const client = requireClient();

  // ── 1. Upsert merchant profile ─────────────────────────────────────────────
  const { data: profileData, error: profileError } = await client
    .from('merchant_profiles')
    .upsert(
      {
        user_id: userId,
        restaurant_name: input.restaurantName.trim(),
        owner_name: input.ownerName.trim(),
        owner_email: input.ownerEmail.trim().toLowerCase(),
        city: input.city.trim(),
        cuisine_type: input.cuisineType.trim(),
        website_url: input.websiteUrl?.trim() || null,
        google_maps_url: input.googleMapsUrl?.trim() || null,
        instagram_url: input.instagramUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single();

  if (profileError) throw new Error(friendlyError(profileError.message));
  if (!profileData) throw new Error('Merchant profile could not be saved.');

  const merchantProfileId = profileData.id as string;

  // ── 2. Insert menu source (with optional review snippets appended) ─────────
  const combined = [
    input.menuText.trim(),
    input.reviewSnippets?.trim()
      ? `\n\n--- CUSTOMER REVIEWS ---\n${input.reviewSnippets.trim()}`
      : '',
    input.targetCustomers.length > 0
      ? `\n\n--- TARGET CUSTOMERS ---\n${input.targetCustomers.join(', ')}`
      : '',
  ]
    .join('')
    .trim();

  const { data: menuData, error: menuError } = await client
    .from('restaurant_menu_sources')
    .insert({
      merchant_id: merchantProfileId,
      source_type: 'text',
      raw_menu_text: combined,
      status: 'pending',
    })
    .select('id')
    .single();

  if (menuError) throw new Error(friendlyError(menuError.message));
  if (!menuData) throw new Error('Menu content could not be saved.');

  return { merchantProfileId, menuSourceId: menuData.id as string };
}
