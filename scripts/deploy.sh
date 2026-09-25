#!/usr/bin/env bash
#
# deploy.sh — build martis-docs and publish it to getmartis.com.
#
# getmartis.com is the official production host for the docs site. It
# runs on Hostinger shared hosting (Apache/LiteSpeed), which only
# allows SSH password auth unless a key is registered in hPanel. The
# static site is built locally and synced into the domain docroot.
#
# Usage:
#   bash scripts/deploy.sh
#   MARTIS_DOCS_SSH_PASS='...' bash scripts/deploy.sh
#
# It refuses to run unless the checkout is clean and at origin/main.
#
set -euo pipefail

SSH_HOST="147.79.113.74"
SSH_PORT="65002"
SSH_USER="u498269178"
DOCROOT="domains/getmartis.com/public_html"
SITE_URL="https://getmartis.com"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Publish only what main holds. A deploy from another branch (or with
# uncommitted edits) replaces the live site with that tree: on 2026-09-25
# a deploy from an old docs branch put the pre-redesign site back up.
# MARTIS_DOCS_DEPLOY_ANY_REF=1 skips the check for a deliberate preview.
if [ "${MARTIS_DOCS_DEPLOY_ANY_REF:-}" != "1" ]; then
  git fetch -q origin main
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "ERROR: uncommitted changes; commit them to main first (or set MARTIS_DOCS_DEPLOY_ANY_REF=1)." >&2
    exit 1
  fi
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "ERROR: HEAD $(git rev-parse --short HEAD) is not origin/main $(git rev-parse --short origin/main); deploy from main (or set MARTIS_DOCS_DEPLOY_ANY_REF=1)." >&2
    exit 1
  fi
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
elif corepack enable >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
else
  PNPM=(npx -y pnpm@9.15.9)
fi

echo "==> Building docs site"
"${PNPM[@]}" build

echo "==> SPA fallback"
test -f dist/.htaccess || {
  echo "ERROR: dist/.htaccess missing — expected Vite to copy public/.htaccess." >&2
  exit 1
}
cp dist/index.html dist/404.html

echo "==> Publishing dist/ -> ${SSH_USER}@${SSH_HOST}:${DOCROOT}"
KEY="$HOME/.ssh/id_ed25519_martis_docs_vps"
TARGET="${SSH_USER}@${SSH_HOST}:${DOCROOT}/"
published=0

if [ -f "$KEY" ]; then
  if rsync -az --delete --itemize-changes \
       -e "ssh -p ${SSH_PORT} -i ${KEY} -o IdentitiesOnly=yes -o BatchMode=yes -o PreferredAuthentications=publickey -o StrictHostKeyChecking=accept-new" \
       dist/ "$TARGET"; then
    published=1
    echo "    (authenticated with SSH key — no password needed)"
  else
    echo "    SSH key not accepted yet; falling back to password."
  fi
fi

if [ "$published" -ne 1 ]; then
  if [ -n "${MARTIS_DOCS_SSH_PASS:-}" ]; then
    PW="$MARTIS_DOCS_SSH_PASS"
  else
    read -rsp "Hostinger SSH password for ${SSH_USER}: " PW
    echo
  fi
  [ -n "$PW" ] || { echo "ERROR: empty password." >&2; exit 1; }
  export PW SSH_HOST SSH_PORT SSH_USER DOCROOT
  expect <<'EXP'
set timeout 600
log_user 1
spawn rsync -az --delete --itemize-changes \
  -e "ssh -p $env(SSH_PORT) -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no" \
  dist/ $env(SSH_USER)@$env(SSH_HOST):$env(DOCROOT)/
expect {
  -re {(?i)are you sure you want to continue connecting} { send "yes\r"; exp_continue }
  -re {(?i)password:} { log_user 0; send "$env(PW)\r"; log_user 1; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
EXP
  RSYNC_RC=$?
  unset PW MARTIS_DOCS_SSH_PASS
  [ "$RSYNC_RC" -eq 0 ] || { echo "ERROR: rsync failed (rc=$RSYNC_RC)." >&2; exit "$RSYNC_RC"; }
fi

echo "==> Verifying ${SITE_URL}"
fail=0
for path in / /docs /compare /contact /search-index.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "${SITE_URL}${path}" || echo 000)
  printf '  %-22s HTTP %s\n' "$path" "$code"
  [ "$code" = "200" ] || fail=1
done
[ "$fail" -eq 0 ] && echo "✅ Deployed and verified: ${SITE_URL}" \
  || { echo "⚠️  Deploy uploaded but a smoke check did not return 200." >&2; exit 1; }
