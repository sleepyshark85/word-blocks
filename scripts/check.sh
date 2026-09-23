#!/usr/bin/env bash
# Every gate this project has, in one command, with a single honest exit code.
#
# This exists because the orchestrator twice committed a broken tree by writing
# `something && git commit`, where the `&&` was gated on the exit status of a *grep* or of
# the pack validators rather than of the thing that had actually broken. A check whose
# result nothing acts on is not a check -- the same shape as the green-checks-that-could-
# not-fail listed in CLAUDE.md, except self-inflicted.
#
#   bash scripts/check.sh   &&   git commit ...
set -u
cd "$(dirname "$0")/.."
fail=0
run() { # name, command...
  local name="$1"; shift
  if "$@" >/tmp/check.out 2>&1; then
    printf '  ok    %s\n' "$name"
  else
    printf '  FAIL  %s\n' "$name"; tail -5 /tmp/check.out | sed 's/^/          /'
    fail=1
  fi
}
run "npm test"              npm test
run "pack vi-seed"          node tools/pack-validate.mjs packs/vi-seed
run "pack en-seed"          node tools/pack-validate.mjs packs/en-seed
run "pack validator tests"  node --test tools/pack-validate.test.mjs
run "theme contrast sweep"  node tools/theme-contrast.mjs
run "layout sweep"          node tools/layout-sweep.mjs

# The app bundles a SNAPSHOT of packs/, because Metro cannot enumerate a directory at
# runtime. Nothing forced that snapshot to be rebuilt when the packs changed, so the owner
# played a build whose bundle was nine hours older than the photographs and saw the emoji
# fallback for every English word. He reported it as "a lot of drawing picture".
#
# The generator is deterministic, so regenerating and diffing IS the check: if the
# committed bundle differs from what packs/ produces now, it was stale.
before=$(sha256sum assets/packs/index.js 2>/dev/null | cut -d" " -f1)
node scripts/build-pack-bundle.mjs >/dev/null 2>&1
after=$(sha256sum assets/packs/index.js 2>/dev/null | cut -d" " -f1)
if [ "$before" = "$after" ]; then
  printf '  ok    bundled pack snapshot is current\n'
else
  printf '  FAIL  bundled pack snapshot was STALE - regenerated it; commit assets/packs/index.js\n'
  fail=1
fi
if [ "$fail" = 0 ]; then echo "ALL GREEN"; else echo "NOT GREEN — do not commit"; fi
exit "$fail"
