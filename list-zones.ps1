$ApiToken = $env:CLOUDFLARE_API_TOKEN
$AccountId = "26e9a9b548af169e0537cc7c404ed827"
$Headers = @{ "Authorization" = "Bearer $ApiToken" }

$resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?account.id=$AccountId" -Headers $Headers -Method GET
Write-Host "Strefy w koncie Cloudflare ($($resp.result.Count)):"
$resp.result | ForEach-Object {
    Write-Host " - $($_.name) (ID: $($_.id), Status: $($_.status))"
}
