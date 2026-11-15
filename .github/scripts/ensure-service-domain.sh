#!/usr/bin/env bash
# Give a Railway service a generated *.up.railway.app domain unless it already
# has one. Railway configuration cannot register domains for a new service, so
# the infra workflow calls this after `railway config apply`. Runs against the
# linked project and environment.
set -euo pipefail

service="${1:?usage: ensure-service-domain.sh <service>}"

domains=$(railway domain list --service "$service" --json)
if jq -e '.domains | length > 0' <<<"$domains" >/dev/null; then
  echo "$service already has a domain: $(jq -r '.domains[0].domain' <<<"$domains")"
  exit 0
fi

railway domain --service "$service"
