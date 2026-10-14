@echo off
setlocal
pushd "%~dp0.." || exit /b 1
docker compose exec -T api-gateway node demo.mjs
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
