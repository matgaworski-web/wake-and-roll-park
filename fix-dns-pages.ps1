$ApiToken = $env:CLOUDFLARE_API_TOKEN
$ZoneId = "d467b061581f1883be0d949cf6700aef"
$Headers = @{ "Authorization" = "Bearer $ApiToken"; "Content-Type" = "application/json" }

# Pobierz istniejace rekordy A i CNAME
$records = (Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" -Headers $Headers -Method GET).result

foreach ($r in $records) {
    if ($r.type -eq "A" -and $r.name -eq "wakeandrollpark.pl") {
        Write-Host "Usuwam stary rekord A wskazujacy na home.pl ($($r.content))..."
        $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($r.id)" -Headers $Headers -Method DELETE
        Write-Host "  [OK] Usunieto rekord A!"
    }
    if ($r.type -eq "CNAME" -and $r.name -eq "www.wakeandrollpark.pl") {
        Write-Host "Usuwam stary rekord CNAME www..."
        $null = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($r.id)" -Headers $Headers -Method DELETE
        Write-Host "  [OK] Usunieto stary rekord CNAME www!"
    }
}

# Utworz nowe rekordy CNAME wskazujace bezposrednio na Cloudflare Pages
$bodyRoot = @{
    type    = "CNAME"
    name    = "@"
    content = "wakeandrollpark.pages.dev"
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

$respRoot = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" -Headers $Headers -Method POST -Body $bodyRoot
Write-Host "  [OK] Dodano CNAME @ -> wakeandrollpark.pages.dev (Proxied: True)"

$bodyWww = @{
    type    = "CNAME"
    name    = "www"
    content = "wakeandrollpark.pages.dev"
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

$respWww = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" -Headers $Headers -Method POST -Body $bodyWww
Write-Host "  [OK] Dodano CNAME www -> wakeandrollpark.pages.dev (Proxied: True)"
