Write-Host ""
Write-Host " ============================================" -ForegroundColor Cyan
Write-Host "  PermissionCreep v1.0" -ForegroundColor White
Write-Host "  JWT and OAuth Token Security Analyser" -ForegroundColor Gray
Write-Host " ============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Starting local server on port 8080..." -ForegroundColor Yellow
Write-Host ""

Set-Location "$PSScriptRoot\dist"
Start-Process "http://localhost:8080"
python -m http.server 8080
