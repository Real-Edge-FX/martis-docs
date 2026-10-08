#!/usr/bin/env bash
#
# deploy.sh — build martis-docs and publish it to getmartis.com.
#
# getmartis.com is the official production host for the docs site. It
# runs on Hostinger shared hosting (Apache/LiteSpeed), which only
# allows SSH password auth unless a key is registered in hPanel. The
# static site is built locally and synced into the domain docroot.
#
# The deploy also syncs the docs pages of the release it publishes: it
# fetches martis-package/docs/ at the tag matching the resolved
# EXPECTED_VERSION and runs scripts/sync-docs.mjs against it before the
# build, so a release's docs never need a separate martis-docs PR.
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
CONTACT_APP="domains/getmartis.com/contact-api"
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

# The release numbers the site shows (version, test count, installs) are
# read from their sources for every deploy: the latest martis-package
# release, the README total at that tag, and Packagist. A source that does
# not answer stops the deploy. site.ts is put back afterwards, so the
# checkout stays at origin/main.
echo "==> Release numbers"
DOCS_PKG_TMPDIR=""
trap 'git checkout -- src/data/site.ts 2>/dev/null || true
      git checkout -- src/content 2>/dev/null || true
      git clean -fdq -- src/content 2>/dev/null || true
      [ -n "$DOCS_PKG_TMPDIR" ] && rm -rf "$DOCS_PKG_TMPDIR"' EXIT
node scripts/release-stats.mjs --write
EXPECTED_VERSION=$(node -e "import('./scripts/release-stats.mjs').then(m=>{const r=m.readSiteRelease(require('fs').readFileSync('src/data/site.ts','utf8'));console.log(r.version+' '+r.tests)})")
read -r EXPECTED_VERSION EXPECTED_TESTS <<< "$EXPECTED_VERSION"

# Pull martis-package/docs/ at the tag this deploy is publishing and sync
# it into src/content before the build, so the docs site never trails the
# release by a separate PR. A failure here stops the deploy loudly, same
# as release-stats: there is no stale-docs fallback.
echo "==> Docs from martis-package v${EXPECTED_VERSION}"
DOCS_PKG_TMPDIR="$(mktemp -d)"
TARBALL_URL="https://codeload.github.com/Real-Edge-FX/martis-package/tar.gz/refs/tags/v${EXPECTED_VERSION}"
if curl -fsSL "$TARBALL_URL" -o "$DOCS_PKG_TMPDIR/pkg.tar.gz" 2>/dev/null; then
  tar -xzf "$DOCS_PKG_TMPDIR/pkg.tar.gz" -C "$DOCS_PKG_TMPDIR"
elif command -v gh >/dev/null 2>&1; then
  echo "    codeload fetch failed (repo private or tag missing); trying gh api."
  gh api "repos/Real-Edge-FX/martis-package/tarball/v${EXPECTED_VERSION}" > "$DOCS_PKG_TMPDIR/pkg.tar.gz"
  tar -xzf "$DOCS_PKG_TMPDIR/pkg.tar.gz" -C "$DOCS_PKG_TMPDIR"
else
  echo "ERROR: could not fetch martis-package v${EXPECTED_VERSION} (codeload failed, gh not installed)." >&2
  exit 1
fi
PKG_DIR="$(find "$DOCS_PKG_TMPDIR" -mindepth 1 -maxdepth 1 -type d -name 'martis-package-*' | head -1)"
[ -n "$PKG_DIR" ] || { echo "ERROR: extracted martis-package tarball has no martis-package-* directory." >&2; exit 1; }
node scripts/sync-docs.mjs --package-dir "$PKG_DIR"

echo "==> Building docs site"
"${PNPM[@]}" build

# The contact endpoint (public/api/contact.php) loads its handler and
# PHPMailer from server/contact, which is published next to public_html,
# never inside it. Its config (SMTP password) lives only on the server.
echo "==> Contact handler"
composer install --no-dev --no-interaction --quiet --working-dir=server/contact
php server/contact/tests/run.php >/dev/null || { echo "ERROR: contact handler checks failed (php server/contact/tests/run.php)." >&2; exit 1; }

echo "==> SPA fallback"
test -f dist/.htaccess || {
  echo "ERROR: dist/.htaccess missing — expected Vite to copy public/.htaccess." >&2
  exit 1
}
cp dist/index.html dist/404.html

KEY="$HOME/.ssh/id_ed25519_martis_docs_vps"
PW=""

# sync_dir SRC DEST [rsync args...]: key first, then the hPanel password
# (asked once per deploy).
sync_dir() {
  local src="$1" dest="${SSH_USER}@${SSH_HOST}:$2"
  shift 2
  if [ -f "$KEY" ] && rsync -az --delete --itemize-changes "$@" \
       -e "ssh -p ${SSH_PORT} -i ${KEY} -o IdentitiesOnly=yes -o BatchMode=yes -o PreferredAuthentications=publickey -o StrictHostKeyChecking=accept-new" \
       "$src" "$dest"; then
    echo "    (authenticated with SSH key — no password needed)"
    return 0
  fi
  [ -f "$KEY" ] && echo "    SSH key not accepted yet; falling back to password."
  if [ -z "$PW" ]; then
    if [ -n "${MARTIS_DOCS_SSH_PASS:-}" ]; then
      PW="$MARTIS_DOCS_SSH_PASS"
    else
      read -rsp "Hostinger SSH password for ${SSH_USER}: " PW
      echo
    fi
    [ -n "$PW" ] || { echo "ERROR: empty password." >&2; exit 1; }
  fi
  local rc=0
  PW="$PW" SSH_PORT="$SSH_PORT" SRC="$src" DEST="$dest" EXTRA="$*" expect <<'EXP' || rc=$?
set timeout 600
log_user 1
eval spawn rsync -az --delete --itemize-changes $env(EXTRA) \
  -e {"ssh -p $env(SSH_PORT) -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no"} \
  $env(SRC) $env(DEST)
expect {
  -re {(?i)are you sure you want to continue connecting} { send "yes\r"; exp_continue }
  -re {(?i)password:} { log_user 0; send "$env(PW)\r"; log_user 1; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
EXP
  [ "$rc" -eq 0 ] || { echo "ERROR: rsync of $src failed (rc=$rc)." >&2; exit "$rc"; }
}

echo "==> Publishing dist/ -> ${SSH_USER}@${SSH_HOST}:${DOCROOT}"
sync_dir dist/ "${DOCROOT}/"

echo "==> Publishing server/contact/ -> ${SSH_USER}@${SSH_HOST}:${CONTACT_APP}"
sync_dir server/contact/ "${CONTACT_APP}/" --exclude=tests/ --exclude=bin/ --exclude=.gitignore --exclude=config.example.php
unset PW MARTIS_DOCS_SSH_PASS

echo "==> Verifying ${SITE_URL}"
fail=0
for path in / /docs /compare /contact /search-index.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "${SITE_URL}${path}" || echo 000)
  printf '  %-22s HTTP %s\n' "$path" "$code"
  [ "$code" = "200" ] || fail=1
done
# A GET reaches the handler only once PHPMailer and the server-side config
# load; it then answers 405. A 500 means the config is missing or invalid.
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "${SITE_URL}/api/contact.php" || echo 000)
printf '  %-22s HTTP %s\n' "/api/contact.php (GET)" "$code"
if [ "$code" != "405" ]; then
  echo "  contact endpoint not ready: create domains/getmartis.com/private/contact-config.php from server/contact/config.example.php" >&2
  fail=1
fi
# The published chunks must carry the numbers this deploy built.
found=0
for asset in $(curl -s --max-time 25 "${SITE_URL}/" | grep -oE '/assets/[A-Za-z0-9_.-]+\.js' | sort -u) \
             $(grep -lE "version:\"${EXPECTED_VERSION}\"" dist/assets/*.js 2>/dev/null | sed 's#^dist##'); do
  body=$(curl -s --max-time 25 "${SITE_URL}${asset}" || true)
  if printf '%s' "$body" | grep -q "version:\"${EXPECTED_VERSION}\"" && printf '%s' "$body" | grep -q "tests:${EXPECTED_TESTS}"; then
    found=1; break
  fi
done
if [ "$found" -eq 1 ]; then
  echo "  release numbers          v${EXPECTED_VERSION}, ${EXPECTED_TESTS} tests"
else
  echo "  release numbers          NOT FOUND (v${EXPECTED_VERSION}, ${EXPECTED_TESTS} tests)" >&2
  fail=1
fi
[ "$fail" -eq 0 ] && echo "✅ Deployed and verified: ${SITE_URL}" \
  || { echo "⚠️  Deploy uploaded but a smoke check did not return 200." >&2; exit 1; }
