#!/usr/bin/env bash
# Seed script: creates Users, Donors (via CSV import), and Events.
# Usage:
#   ./seed.sh                                              # localhost:3000
#   API_URL=https://cs5500-project.onrender.com ./seed.sh

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV_FILE="$SCRIPT_DIR/seed_donors.csv"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
fail() { echo -e "${RED}  ✗${NC} $*"; }

# ── 1. Register users ─────────────────────────────────────────────────────────
echo -e "\n=== Creating users ==="

register_user() {
  local name="$1" email="$2" password="$3" role="$4"
  resp=$(curl -sf -X POST "$API_URL/api/user/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}" 2>&1) && \
    ok "$email ($role)" || {
      if echo "$resp" | grep -q "already exists"; then
        echo "  - $email already exists, skipping"
      else
        fail "$email: $resp"
      fi
    }
}

register_user "Alice Chen"  "alice@example.com"  "Password123!" "pmm"
register_user "Bob Nguyen"  "bob@example.com"    "Password123!" "smm"
register_user "Carol Davis" "carol@example.com"  "Password123!" "vmm"
register_user "David Kim"   "david@example.com"  "Password123!" "pmm"
register_user "Emma Wilson" "emma@example.com"   "Password123!" "smm"

# ── 2. Login ──────────────────────────────────────────────────────────────────
echo -e "\n=== Logging in ==="
LOGIN_RESP=$(curl -sf -X POST "$API_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password123!"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  fail "Could not obtain token. Response: $LOGIN_RESP"
  exit 1
fi
ok "Authenticated as alice@example.com"

# ── 3. Generate donor CSV ─────────────────────────────────────────────────────
echo -e "\n=== Generating donor CSV ==="

FIRST_NAMES=("James" "Mary" "John" "Patricia" "Robert" "Jennifer" "Michael" "Linda" "William" "Barbara" "David" "Susan" "Richard" "Jessica" "Joseph" "Sarah")
LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Martinez" "Hernandez" "Lopez" "Wilson" "Anderson" "Thomas" "Taylor" "Clark")
CITIES=("Vancouver" "Toronto" "Calgary" "Ottawa" "Edmonton" "Montreal" "Winnipeg" "Halifax")
APPEALS=("Annual Fund" "Major Gift" "Planned Giving" "Capital Campaign" "Emergency Fund")
PREFS=("Email" "Phone" "Mail")
TAGS=("VIP" "Alumni" "Corporate" "Foundation" "Recurring" "Lapsed" "Board Member")

{
  echo "first_name,nick_name,last_name,organization_name,pmm,smm,vmm,total_donations,total_pledges,largest_gift,largest_gift_appeal,first_gift_date,last_gift_date,last_gift_amount,last_gift_request,last_gift_appeal,address_line1,city,communication_preference,tags"

  for i in $(seq 1 200); do
    first="${FIRST_NAMES[$((RANDOM % ${#FIRST_NAMES[@]}))]}"
    last="${LAST_NAMES[$((RANDOM % ${#LAST_NAMES[@]}))]}"
    city="${CITIES[$((RANDOM % ${#CITIES[@]}))]}"
    appeal="${APPEALS[$((RANDOM % ${#APPEALS[@]}))]}"
    appeal2="${APPEALS[$((RANDOM % ${#APPEALS[@]}))]}"
    pref="${PREFS[$((RANDOM % ${#PREFS[@]}))]}"
    tag="${TAGS[$((RANDOM % ${#TAGS[@]}))]}"
    total=$(( (RANDOM % 49500) + 500 ))
    largest=$(( total / 3 + RANDOM % (total / 3 + 1) ))
    last_amt=$(( largest / 4 + RANDOM % (largest / 4 + 1) ))
    pledges=$(( total / 5 ))
    first_year=$(( 2010 + RANDOM % 10 ))
    last_year=$(( first_year + RANDOM % 6 + 1 ))
    first_ts=$(date -j -f "%Y-%m-%d" "${first_year}-01-01" "+%s" 2>/dev/null || date -d "${first_year}-01-01" "+%s")
    last_ts=$(date -j -f "%Y-%m-%d" "${last_year}-06-15" "+%s" 2>/dev/null || date -d "${last_year}-06-15" "+%s")
    echo "$first,${first:0:3},$last,,Alice Chen,Bob Nguyen,Carol Davis,$total,$pledges,$largest,\"$appeal\",$first_ts,$last_ts,$last_amt,\"$appeal\",\"$appeal2\",${i} Main St,$city,$pref,$tag"
  done
} > "$CSV_FILE"

ok "Generated $CSV_FILE (200 donors)"

# ── 4. Import donor CSV ───────────────────────────────────────────────────────
echo -e "\n=== Importing donors ==="
IMPORT_RESP=$(curl -sf -X POST "$API_URL/api/donors/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$CSV_FILE;type=text/csv")
OP_ID=$(echo "$IMPORT_RESP" | grep -o '"operationId":"[^"]*"' | cut -d'"' -f4)
ok "Import started: $OP_ID"

echo "  Waiting for import to complete..."
for attempt in $(seq 1 30); do
  sleep 2
  PROGRESS_RESP=$(curl -sf "$API_URL/api/progress/$OP_ID" -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "")
  STATUS=$(echo "$PROGRESS_RESP" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  MESSAGE=$(echo "$PROGRESS_RESP" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
  echo "  [$attempt/30] $STATUS: $MESSAGE"
  if [[ "$STATUS" == "completed" || "$STATUS" == "completed_with_errors" || "$STATUS" == "error" ]]; then
    break
  fi
done
ok "Import finished: $MESSAGE"

# ── 5. Create events ──────────────────────────────────────────────────────────
echo -e "\n=== Creating events ==="

create_event() {
  local name="$1" type="$2" date="$3" location="$4" capacity="$5" focus="$6" min_giving="$7"
  resp=$(curl -sf -X POST "$API_URL/api/events" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"type\":\"$type\",\"date\":\"$date\",\"location\":\"$location\",\"capacity\":$capacity,\"focus\":\"$focus\",\"criteriaMinGivingLevel\":$min_giving}") && \
    ok "$name" || fail "$name: $resp"
}

create_event "Healthcare Annual Gala 2025"        "Annual Gala"          "2025-09-15T18:00:00.000Z" "Vancouver" 150 "Healthcare"  5000
create_event "Education Major Donor Luncheon"      "Luncheon"             "2025-10-20T12:00:00.000Z" "Toronto"   80  "Education"   10000
create_event "Arts Stewardship Dinner 2025"        "Stewardship Dinner"   "2025-11-05T19:00:00.000Z" "Montreal"  60  "Arts"        25000
create_event "Community Golf Tournament"           "Golf Tournament"      "2025-08-30T08:00:00.000Z" "Calgary"   120 "Community"   1000
create_event "Research Major Donor Event"          "Major Donor Event"    "2025-12-01T17:00:00.000Z" "Ottawa"    40  "Research"    50000
create_event "Spring Healthcare Luncheon 2026"     "Luncheon"             "2026-03-10T12:00:00.000Z" "Vancouver" 100 "Healthcare"  5000
create_event "Alumni Education Gala 2026"          "Annual Gala"          "2026-04-22T18:00:00.000Z" "Toronto"   200 "Education"   0
create_event "Arts Foundation Stewardship Night"   "Stewardship Dinner"   "2026-05-14T19:00:00.000Z" "Calgary"   50  "Arts"        10000
create_event "Community Impact Golf Classic"       "Golf Tournament"      "2026-06-05T08:00:00.000Z" "Edmonton"  100 "Community"   2500
create_event "Research Excellence Donor Dinner"    "Major Donor Event"    "2026-07-18T18:00:00.000Z" "Montreal"  30  "Research"    100000

echo -e "\n=== Seeding complete ==="
