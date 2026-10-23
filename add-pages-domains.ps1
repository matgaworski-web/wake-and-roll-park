$AccountId = "26e9a9b548af169e0537cc7c404ed827"
$ProjectName = "wakeandrollpark"
$ApiToken = $env:CLOUDFLARE_API_TOKEN

$Headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type"  = "application/json"
}

$domains = @("wakeandrollpark.pl", "www.wakeandrollpark.pl")

foreach ($d in $domains) {
    Write-Host "Dodawanie domeny $d do Cloudflare Pages..." -ForegroundColor Cyan
    $body = @{ name = $d } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/domains" `
            -Headers $Headers -Method POST -Body $body
        Write-Host "  [OK] Domena $d dodana do Pages! Status: $($resp.result.status)" -ForegroundColor Green
    } catch {
        Write-Host "  [Info/Blad]: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
}
