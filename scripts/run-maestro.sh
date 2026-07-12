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

PORT="${EXPO_DEV_SERVER_PORT:-8081}"
if command -v lsof >/dev/null 2>&1; then
  if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Metro dev server not detected on port $PORT." >&2
    echo "Start it with: npx expo start --dev-client --port $PORT" >&2
    exit 1
  fi
elif command -v nc >/dev/null 2>&1; then
  if ! nc -z localhost "$PORT" >/dev/null 2>&1; then
    echo "Metro dev server not detected on port $PORT." >&2
    echo "Start it with: npx expo start --dev-client --port $PORT" >&2
    exit 1
  fi
fi

export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

FLOW="${MAESTRO_FLOW:-.maestro/smoke.yaml}"
if [ -n "${MAESTRO_DEVICE_ID:-}" ]; then
  exec maestro --udid "$MAESTRO_DEVICE_ID" test "$FLOW"
fi

exec maestro test "$FLOW"
