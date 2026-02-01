#!/usr/bin/env bash
set -euo pipefail

if [ -z "${JAVA_HOME:-}" ]; then
  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  fi

  if [ -z "${JAVA_HOME:-}" ] && command -v brew >/dev/null 2>&1; then
    BREW_PREFIX="$(brew --prefix openjdk@17 2>/dev/null || true)"
    if [ -n "${BREW_PREFIX}" ]; then
      JAVA_HOME="${BREW_PREFIX}"
    fi
  fi
fi

if [ -z "${JAVA_HOME:-}" ]; then
  echo "Java 17 not found. Install it (brew install openjdk@17) or set JAVA_HOME." >&2
  exit 1
fi

export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

exec maestro test .maestro/smoke.yaml
