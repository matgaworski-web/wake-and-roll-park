$ApiToken = $env:CLOUDFLARE_API_TOKEN
$ZoneId = "d467b061581f1883be0d949cf6700aef"
$Headers = @{ "Authorization" = "Bearer $ApiToken" }

$resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" -Headers $Headers -Method GET
Write-Host "Rekordy DNS w strefie wakeandrollpark.pl ($($resp.result.Count)):"
$resp.result | ForEach-Object {
    Write-Host " - Type: $($_.type), Name: $($_.name), Content: $($_.content), Proxied: $($_.proxied)"
}
