#!/usr/bin/env bash
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
# O Node e executado dentro do gateway: nao requer jq, grep nem Node no host.
# O cliente interno NAO testa o mapeamento de porta no host; teste-o separadamente.
docker compose exec -T api-gateway node test-api.mjs
