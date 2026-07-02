#!/usr/bin/env bash
# Capture the RQ + RS of a LiteAPI flight prebook for support (Kaveh @ LiteAPI).
#
# It (1) pulls a fresh offerId from our own public flight search, then
# (2) calls LiteAPI's /flights/prebooks DIRECTLY with the production key and
# prints the exact request body we send + the full raw response (status,
# headers incl. request-id, body). Output is also saved to a file you can
# attach/paste to support. The API key is read from the environment and is
# NEVER printed.
#
# Usage:
#   LITEAPI_PROD_KEY=... bash scripts/flight-prebook-capture.sh
# or, if the key is in .env.local:
#   bash scripts/flight-prebook-capture.sh
set -u

# --- resolve key (env var wins; else grab from .env.local) --------------------
KEY="${LITEAPI_PROD_KEY:-}"
if [ -z "$KEY" ] && [ -f .env.local ]; then
  KEY="$(grep -E '^LITEAPI_PROD_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '"'"'"' ')"
fi
if [ -z "$KEY" ]; then
  echo "ERROR: LITEAPI_PROD_KEY not set. Run: LITEAPI_PROD_KEY=xxxx bash scripts/flight-prebook-capture.sh" >&2
  exit 1
fi

BASE="https://api.liteapi.travel/v3.0"
SITE="https://www.humblehalal.com"
FROM="${FROM:-SIN}"; TO="${TO:-KUL}"; DATE="${DATE:-2026-08-15}"
OUT="/tmp/liteapi-prebook-rqrs.txt"
: > "$OUT"

log() { echo "$@" | tee -a "$OUT"; }

log "=== LiteAPI flight prebook capture ==="
log "Route: $FROM -> $TO  Date: $DATE  (1 adult, SGD)"
log "Time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log ""

# --- 1) fresh offerId from our public search (uses the same prod key server-side)
log "--- getting a fresh offerId from $SITE/api/travel/flights/search ---"
SEARCH=$(curl -s -X POST "$SITE/api/travel/flights/search" -H 'Content-Type: application/json' \
  -d "{\"origin\":\"$FROM\",\"destination\":\"$TO\",\"date\":\"$DATE\",\"adults\":1,\"currency\":\"SGD\"}")
OFFER=$(printf '%s' "$SEARCH" | python3 -c 'import sys,json
d=json.load(sys.stdin)
def f(o):
 if isinstance(o,dict):
  if isinstance(o.get("offerId"),str) and o["offerId"]: return o["offerId"]
  for v in o.values():
   r=f(v)
   if r: return r
 if isinstance(o,list):
  for v in o:
   r=f(v)
   if r: return r
print(f(d) or "")')
if [ -z "$OFFER" ]; then
  log "ERROR: no offerId returned from search. Raw (first 400 chars):"
  log "$(printf '%s' "$SEARCH" | head -c 400)"
  exit 1
fi
log "offerId: ${OFFER:0:70}...(${#OFFER} chars)"
log ""

# --- 2) build the EXACT prebook request body our app sends --------------------
RQ=$(cat <<JSON
{
  "offerId": "$OFFER",
  "usePaymentSdk": true,
  "contact": { "firstName": "Nurul", "lastName": "Hakim", "email": "nurul.hakim@gmail.com", "phoneNumber": "91234567", "phoneCountryCode": "65" },
  "passengers": [
    { "firstName": "Nurul", "lastName": "Hakim", "birthday": "1990-01-01", "passengerType": 0, "documentType": "passport", "documentNumber": "E1234567", "documentIssueCountry": "SG", "documentExpiry": "2030-01-01", "gender": "M", "nationality": "SG" }
  ]
}
JSON
)

log "=== REQUEST (RQ) ==="
log "POST $BASE/flights/prebooks"
log "Headers: X-API-Key: <redacted>  |  Content-Type: application/json  |  accept: application/json"
log "Body:"
log "$RQ"
log ""

# --- 3) call LiteAPI directly, capture status + headers + body ----------------
log "=== RESPONSE (RS) ==="
curl -s -D "/tmp/liteapi-prebook-headers.txt" -o "/tmp/liteapi-prebook-body.txt" \
  -w "HTTP %{http_code}  (time_total=%{time_total}s)\n" \
  -X POST "$BASE/flights/prebooks" \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -H 'accept: application/json' \
  -d "$RQ" | tee -a "$OUT"
log ""
log "--- Response headers (X-API-Key never sent back; look for request-id / x-request-id) ---"
grep -iE 'request-id|x-request|date|content-type|cf-ray' /tmp/liteapi-prebook-headers.txt | tee -a "$OUT"
log ""
log "--- Response body ---"
python3 -m json.tool < /tmp/liteapi-prebook-body.txt 2>/dev/null | tee -a "$OUT" || cat /tmp/liteapi-prebook-body.txt | tee -a "$OUT"
log ""
log "Saved full capture to: $OUT"
log "Send that file (RQ + RS) to Kaveh."
