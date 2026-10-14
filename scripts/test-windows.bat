@echo off
setlocal
pushd "%~dp0.." || exit /b 1
rem O mesmo cliente JSON roda no Node do container. Nao exige Node local.
docker compose exec -T api-gateway node test-api.mjs
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
