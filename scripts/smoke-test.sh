#!/usr/bin/env bash
# Production smoke tests. Run after deploying:
#   API_URL=https://coloursense-api.onrender.com WEB_URL=https://your-app.vercel.app ./scripts/smoke-test.sh

set -uo pipefail

API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS  $name ($actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

status() { curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$1"; }

echo "Smoke testing API at $API_URL"
check "health"                      200 "$(status "$API_URL/api/v1/health")"
check "readiness"                   200 "$(status "$API_URL/api/v1/readiness")"
check "seasons catalogue"           200 "$(status "$API_URL/api/v1/seasons")"
check "season detail"               200 "$(status "$API_URL/api/v1/seasons/autumn")"
check "products list"               200 "$(status "$API_URL/api/v1/products")"
check "unknown route envelope"      404 "$(status "$API_URL/api/v1/definitely-not-real")"
check "history requires auth"       401 "$(status "$API_URL/api/v1/analyses")"
check "admin requires auth"         401 "$(status "$API_URL/api/v1/admin/stats")"

readiness_body="$(curl -s --max-time 30 "$API_URL/api/v1/readiness")"
if echo "$readiness_body" | grep -q '"database":"ok"'; then
  echo "  PASS  readiness reports database ok"
  PASS=$((PASS + 1))
else
  echo "  FAIL  readiness database check: $readiness_body"
  FAIL=$((FAIL + 1))
fi

echo "Smoke testing web at $WEB_URL"
check "landing page"                200 "$(status "$WEB_URL/")"
check "analysis wizard"             200 "$(status "$WEB_URL/analysis")"
check "products page"               200 "$(status "$WEB_URL/products")"
check "sign-in page"                200 "$(status "$WEB_URL/sign-in")"

landing="$(curl -s --max-time 30 "$WEB_URL/")"
if echo "$landing" | grep -qi "content-security-policy" || curl -sI --max-time 30 "$WEB_URL/" | grep -qi "content-security-policy"; then
  echo "  PASS  CSP header present"
  PASS=$((PASS + 1))
else
  echo "  FAIL  CSP header missing"
  FAIL=$((FAIL + 1))
fi

echo
echo "$PASS passed, $FAIL failed."
exit $((FAIL > 0 ? 1 : 0))
