$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    & docker compose exec -T api-gateway node test-api.mjs
    $Result = $LASTEXITCODE
    if ($Result -ne 0) { throw "Falha nos testes HTTP (codigo $Result)." }
} finally { Pop-Location }
