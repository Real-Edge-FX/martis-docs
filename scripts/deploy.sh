#!/usr/bin/env bash
#
# deploy.sh — build martis-docs and publish it to getmartis.com.
#
# getmartis.com is the official production host for the docs site. It
# runs on Hostinger shared hosting (Apache/LiteSpeed), which only
# allows SSH *password* auth — no keys, no SFTP batch. So we build the
# static site locally and rsync dist/ into the domain docroot over SSH.
#
# The password is read once at runtime (or taken from the
# MARTIS_DOCS_SSH_PASS env var for CI), kept only in memory, never
# written to disk and never echoed.
#
# Usage:
#   bash scripts/deploy.sh
#   MARTIS_DOCS_SSH_PASS='...' bash scripts/deploy.sh   # non-interactive
#
set -euo pipefail

# --- Target (Hostinger shared hosting) -------------------------------
SSH_HOST="147.79.113.74"
SSH_PORT="65002"
SSH_USER="u498269178"
DOCROOT="domains/getmartis.com/public_html"
SITE_URL="https://getmartis.com"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# --- Toolchain -------------------------------------------------------
if command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
elif corepack enable >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
else
  PNPM=(npx -y pnpm@9.15.9)
fi

# --- Clean tree -------------------------------------------------------
# Publish only what is committed: a build from uncommitted changes would
# put code on getmartis.com that no commit (and no review) describes.
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: the working tree has uncommitted changes; commit or stash them before deploying:" >&2
  git status --short >&2
  exit 1
fi

echo "==> Building docs site"
"${PNPM[@]}" build

echo "==> Smoke-checking dist/"
# The same artifact gate CI runs: every route's HTML and head, assets,
# social images, sitemap, robots.txt and both .htaccess files.
"${PNPM[@]}" smoke:dist

echo "==> Verifying prerendered build output"
# .htaccess ships from public/ via Vite; assert it landed in the build.
test -f dist/.htaccess || {
  echo "ERROR: dist/.htaccess missing — expected Vite to copy public/.htaccess." >&2
  exit 1
}
# dist/404.html is written by scripts/prerender.mjs (part of `pnpm
# build` above), not copied here: the site is prerendered now, not a
# client-rendered SPA, so overwriting it with dist/index.html (the old
# safety net) would ship the wrong <title>, canonical and noindex for
# every 404.
test -f dist/404.html || {
  echo "ERROR: dist/404.html missing — expected \`pnpm build\` to prerender it." >&2
  exit 1
}

# --- Publish (SSH key preferred, password fallback) ------------------
echo "==> Publishing dist/ -> ${SSH_USER}@${SSH_HOST}:${DOCROOT}"
KEY="$HOME/.ssh/id_ed25519_martis_docs_vps"
TARGET="${SSH_USER}@${SSH_HOST}:${DOCROOT}/"
published=0

# 1) SSH key, no prompt. Works once the matching public key is in the
#    server's ~/.ssh/authorized_keys (register it via hPanel once).
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

# 2) Password fallback, via expect. Interactive prompt, or
#    MARTIS_DOCS_SSH_PASS for non-interactive runs. Never persisted.
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

# --- Verify ----------------------------------------------------------
echo "==> Verifying ${SITE_URL}"
fail=0
for path in / /docs /docs/getting-started/installation /product /search-index.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "${SITE_URL}${path}" || echo 000)
  printf '  %-45s HTTP %s (expect 200)\n' "$path" "$code"
  [ "$code" = "200" ] || fail=1
done

# A path that cannot exist, and a directory with no page of its own,
# must come back as a real 404 (not a 200 SPA-fallback page, not a 403
# directory refusal): proves .htaccess's rewrites and ErrorDocument are
# live on the real host, not just correct on paper. A trailing-slash URL
# and an /index.html URL must redirect to the clean one.
not_found_path="/this-page-does-not-exist-$(date +%s)"
for probe in "${not_found_path} 404" "/docs/core 404" "/product/ 301" "/docs/index.html 301"; do
  path="${probe% *}"
  expected="${probe##* }"
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "${SITE_URL}${path}" || echo 000)
  printf '  %-45s HTTP %s (expect %s)\n' "$path" "$code" "$expected"
  [ "$code" = "$expected" ] || fail=1
done

[ "$fail" -eq 0 ] && echo "✅ Deployed and verified: ${SITE_URL}" \
  || { echo "⚠️  Deploy uploaded but a smoke check did not return the expected status." >&2; exit 1; }
