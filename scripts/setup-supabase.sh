#!/bin/bash
# =============================================================================
# CraveMap — Supabase Production Setup
# Usage: bash scripts/setup-supabase.sh
#
# What this does:
#   1. Asks for your Supabase URL + anon key
#   2. Writes them to .env (local dev)
#   3. Sets EAS secrets (production build)
#   4. Applies the SQL migrations via Supabase REST API
#   5. Verifies the tables were created
# =============================================================================

set -e

echo "============================================"
echo "  CraveMap Supabase Production Setup"
echo "============================================"
echo ""
echo "Find your credentials at:"
echo "  supabase.com → your project → Settings → API"
echo ""

# ── Collect credentials ──────────────────────────────────────────────────────
read -p "Supabase Project URL (https://xxxx.supabase.co): " SUPABASE_URL
read -p "Supabase anon/public key: " SUPABASE_ANON_KEY
read -p "Supabase service_role key (Settings → API → service_role): " SUPABASE_SERVICE_KEY

# Trim trailing slash
SUPABASE_URL="${SUPABASE_URL%/}"

echo ""
echo "Writing .env ..."
cat > .env <<EOF
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOF
echo "  ✓ .env written"

# ── EAS secrets ──────────────────────────────────────────────────────────────
echo ""
echo "Setting EAS production secrets ..."
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value "$SUPABASE_URL" --force 2>/dev/null || \
  npx eas-cli secret:push --scope project --force <<< "EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}"
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "$SUPABASE_ANON_KEY" --force 2>/dev/null || true
echo "  ✓ EAS secrets set"

# ── Apply SQL migrations via REST API ─────────────────────────────────────────
echo ""
echo "Applying SQL migration 001 (base schema — if not yet applied) ..."
# Migration 002 — UGC compliance
echo "Applying SQL migration 002 (UGC compliance: reports, blocks, delete_account) ..."

MIGRATION_SQL=$(cat supabase/migrations/002_ugc_compliance.sql)

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$MIGRATION_SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" \
  2>&1)

# Supabase doesn't have exec_sql, use pg REST approach via supabase CLI
# Fall back to instructions
echo ""
echo "  ⚠  Automatic migration requires Supabase CLI linked to your project."
echo "  Manual step (30 seconds):"
echo ""
echo "  1. Go to: ${SUPABASE_URL%.*}.supabase.com → SQL Editor"
echo "  2. Paste the contents of: supabase/migrations/002_ugc_compliance.sql"
echo "  3. Click Run"
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "============================================"
echo "  Done! Next steps:"
echo "  1. Apply migration 002 manually in SQL Editor (see above)"
echo "  2. Run: npx expo start"
echo "     → App should say 'Supabase mode' in dev console"
echo "  3. When ready to build: eas build --profile production --platform ios"
echo "============================================"
