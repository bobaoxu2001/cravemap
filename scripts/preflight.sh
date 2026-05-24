#!/usr/bin/env bash
# CraveMap pre-build sanity checks.
# Runs before `eas build` so dumb mistakes (committed .env, alpha-channel icon,
# regressed mock URLs) fail fast on your laptop instead of at App Review.
#
# Usage:  npm run preflight   (or)  bash scripts/preflight.sh
# Exit:   0 on clean, 1 on any failure.

set -uo pipefail
cd "$(dirname "$0")/.."

# ─── pretty output ─────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; DIM=""; RESET=""
fi

fails=0
warns=0

pass() { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "  ${RED}✗${RESET} %s\n" "$1"; fails=$((fails + 1)); }
warn() { printf "  ${YELLOW}!${RESET} %s\n" "$1"; warns=$((warns + 1)); }
section() { printf "\n${DIM}── %s ──${RESET}\n" "$1"; }

# ─── 1. TypeScript ─────────────────────────────────────────────────────────────
section "TypeScript"
if npm run --silent typecheck >/tmp/cravemap-tsc.log 2>&1; then
  pass "tsc --noEmit clean"
else
  fail "tsc errors — see /tmp/cravemap-tsc.log"
  tail -20 /tmp/cravemap-tsc.log | sed 's/^/    /'
fi

# ─── 2. Secrets hygiene ────────────────────────────────────────────────────────
section "Secrets hygiene"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail ".env is TRACKED in git — rotate the credentials NOW and untrack it"
else
  pass ".env not tracked in git"
fi

# Catch accidentally-committed secret files (anything matching .env.* except .env.example)
tracked_envs=$(git ls-files | grep -E '^\.env(\..+)?$' | grep -v '^\.env\.example$' || true)
if [ -n "$tracked_envs" ]; then
  fail "These env files are tracked but probably shouldn't be:"
  echo "$tracked_envs" | sed 's/^/      /'
else
  pass "no rogue .env.* files committed"
fi

# Heuristic scan: look for hardcoded Supabase/OpenAI keys in tracked source.
# Both have predictable prefixes (sb-/sbp_ for Supabase service keys, sk- for OpenAI).
if git grep -nE '(sk-[A-Za-z0-9]{20,}|sbp_[A-Za-z0-9]{20,})' -- ':!*.lock' ':!scripts/preflight.sh' 2>/dev/null; then
  fail "found what looks like a hardcoded API key in tracked source ↑"
else
  pass "no hardcoded API keys in tracked source"
fi

# ─── 3. App Store icon ─────────────────────────────────────────────────────────
section "App Store icon"
if [ ! -f assets/icon.png ]; then
  fail "assets/icon.png missing"
else
  if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" 2>/dev/null; then
    icon_info=$(python3 -c "from PIL import Image; img=Image.open('assets/icon.png'); print(f'{img.mode}|{img.size[0]}x{img.size[1]}')" 2>/dev/null)
    mode="${icon_info%|*}"
    size="${icon_info#*|}"
    if [ "$mode" = "RGB" ] && [ "$size" = "1024x1024" ]; then
      pass "icon.png is RGB 1024x1024 (Apple-compliant)"
    else
      fail "icon.png is $mode $size — Apple requires RGB 1024x1024 with no alpha channel"
    fi
  else
    warn "skipping icon mode check (need: python3 + Pillow → pip install Pillow)"
  fi
fi

# ─── 4. Mock-data leakage into production ──────────────────────────────────────
section "No mock URLs in production data"
if grep -q "picsum.photos" supabase/seed.sql 2>/dev/null; then
  fail "picsum.photos URLs in supabase/seed.sql — production users will see random landscape photos"
else
  pass "supabase/seed.sql is picsum-free"
fi

# Lock the rest of mock-only image hosts out of the SQL seed too.
if grep -qE "(loremflickr|placehold|placeholder)" supabase/seed.sql 2>/dev/null; then
  warn "non-real image host detected in supabase/seed.sql (loremflickr/placehold) — fine for beta, swap for real CDN before public launch"
fi

# ─── 5. app.json basics ────────────────────────────────────────────────────────
section "app.json basics"
if ! command -v node >/dev/null 2>&1; then
  warn "skipping app.json checks (node not on PATH)"
else
  node -e "
    const a = require('./app.json').expo;
    const out = [];
    if (!a.ios?.bundleIdentifier) out.push('FAIL:missing ios.bundleIdentifier');
    else out.push('PASS:ios.bundleIdentifier = ' + a.ios.bundleIdentifier);

    if (!a.version || !/^\d+\.\d+\.\d+/.test(a.version)) out.push('FAIL:version must be semver, got ' + a.version);
    else out.push('PASS:version = ' + a.version);

    if (a.ios?.supportsTablet === true) out.push('WARN:supportsTablet=true — you will need iPad screenshots for App Store');
    else out.push('PASS:supportsTablet disabled — no iPad screenshots required');

    if (!a.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === undefined) out.push('WARN:ITSAppUsesNonExemptEncryption not declared — Apple will ask at submission');
    else out.push('PASS:encryption flag declared (' + a.ios.infoPlist.ITSAppUsesNonExemptEncryption + ')');

    for (const line of out) console.log(line);
  " 2>/dev/null | while IFS=: read -r kind msg; do
    case "$kind" in
      PASS) pass "$msg" ;;
      FAIL) fail "$msg" ;;
      WARN) warn "$msg" ;;
    esac
  done
fi

# ─── 6. EAS secrets reminder (informational) ───────────────────────────────────
section "Reminders (manual)"
echo "    ${DIM}• Set EAS secrets before building production:${RESET}"
echo "    ${DIM}    eas secret:list${RESET}"
echo "    ${DIM}    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL ...${RESET}"
echo "    ${DIM}    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY ...${RESET}"
echo "    ${DIM}    eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY ...   (optional)${RESET}"
echo "    ${DIM}• Verify reviewer demo account exists in production Supabase${RESET}"
echo "    ${DIM}• Confirm Privacy Policy URL loads: https://bobaoxu2001.github.io/cravemap/index.html${RESET}"

# ─── summary ───────────────────────────────────────────────────────────────────
echo
if [ "$fails" -eq 0 ] && [ "$warns" -eq 0 ]; then
  printf "${GREEN}✓ preflight clean${RESET}\n"
  exit 0
elif [ "$fails" -eq 0 ]; then
  printf "${YELLOW}! preflight clean with %d warning(s)${RESET}\n" "$warns"
  exit 0
else
  printf "${RED}✗ preflight failed: %d error(s), %d warning(s)${RESET}\n" "$fails" "$warns"
  exit 1
fi
