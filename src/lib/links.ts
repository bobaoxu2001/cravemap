// Web landing URLs for sharing.
//
// Recipients without the app installed need somewhere to land — a bare
// `cravemap://` deep link is dead on a browser. These helpers wrap the
// deployed privacy-site landing pages, which try the deep link, fall back
// to App Store / Play Store, and (for invites) show the code for manual entry.
//
// Update WEB_BASE_URL to wherever privacy-site/ is actually deployed. The
// default matches the planned domain in APP_STORE.md.

export const WEB_BASE_URL = 'https://bobaoxu2001.github.io/cravemap';

/** Public share URL for an invite code. Lands on privacy-site/invite.html. */
export function getInviteShareUrl(code: string): string {
  return `${WEB_BASE_URL}/invite.html?code=${encodeURIComponent(code)}`;
}

/** Public share URL for a restaurant. Lands on privacy-site/restaurant.html. */
export function getRestaurantShareUrl(restaurantId: string): string {
  return `${WEB_BASE_URL}/restaurant.html?id=${encodeURIComponent(restaurantId)}`;
}
