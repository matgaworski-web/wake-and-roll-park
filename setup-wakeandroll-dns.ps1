$ApiToken = $env:CLOUDFLARE_API_TOKEN
$AccountId = "26e9a9b548af169e0537cc7c404ed827"
$Headers = @{ "Authorization" = "Bearer $ApiToken"; "Content-Type" = "application/json" }

# Pobierz strefę wakeandroll.pl
$zoneResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=wakeandroll.pl&account.id=$AccountId" -Headers $Headers -Method GET
$zone = $zoneResp.result[0]
$zoneId = $zone.id

Write-Host "Konfiguracja strefy wakeandroll.pl (ID: $zoneId)..." -ForegroundColor Cyan

# CNAME @ -> wakeandrollpark.pages.dev
$bodyRoot = @{
    type    = "CNAME"
    name    = "@"
    content = "wakeandrollpark.pages.dev"
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

try {
    $r1 = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $Headers -Method POST -Body $bodyRoot
    Write-Host "  [OK] wakeandroll.pl CNAME @ -> wakeandrollpark.pages.dev" -ForegroundColor Green
} catch {
    Write-Host "  [Info CNAME @]: $($_.Exception.Message)" -ForegroundColor Yellow
}

# CNAME www -> wakeandrollpark.pages.dev
$bodyWww = @{
    type    = "CNAME"
    name    = "www"
    content = "wakeandrollpark.pages.dev"
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

try {
    $r2 = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $Headers -Method POST -Body $bodyWww
    Write-Host "  [OK] wakeandroll.pl CNAME www -> wakeandrollpark.pages.dev" -ForegroundColor Green
} catch {
    Write-Host "  [Info CNAME www]: $($_.Exception.Message)" -ForegroundColor Yellow
}

# SSL Full & Always HTTPS
$sslBody = @{ value = "full" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/settings/ssl" -Headers $Headers -Method PATCH -Body $sslBody

$httpsBody = @{ value = "on" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/settings/always_use_https" -Headers $Headers -Method PATCH -Body $httpsBody

Write-Host "  [OK] SSL Full + Always Use HTTPS wlaczone dla wakeandroll.pl!" -ForegroundColor Green
