$ApiToken = $env:CLOUDFLARE_API_TOKEN
$AccountId = "26e9a9b548af169e0537cc7c404ed827"
$Headers = @{ "Authorization" = "Bearer $ApiToken"; "Content-Type" = "application/json" }

$createBody = @{
    account = @{ id = $AccountId }
    name    = "wakeandroll.pl"
    type    = "full"
} | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Headers $Headers -Method POST -Body $createBody
    Write-Host "Strefa wakeandroll.pl utworzona w Cloudflare! NS: $($resp.result.name_servers -join ', ')"
} catch {
    Write-Host "Blad dodawania wakeandroll.pl: $($_.Exception.Message)"
}
