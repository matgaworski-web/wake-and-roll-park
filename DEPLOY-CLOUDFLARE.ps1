# =====================================================================
# WAKE & ROLL PARK - Auto Deploy na Cloudflare Pages
# Uruchom ten skrypt jako Administrator lub kliknij dwukrotnie
# =====================================================================

$AccountId = "26e9a9b548af169e0537cc7c404ed827"
$ProjectName = "wakeandrollpark"
$SiteDir = $PSScriptRoot
$ApiToken = $env:CLOUDFLARE_API_TOKEN

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  WAKE & ROLL PARK - Deploy na Cloudflare Pages" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $ApiToken) {
    Write-Host "[!] Nie znaleziono zmiennej CLOUDFLARE_API_TOKEN" -ForegroundColor Yellow
    Write-Host "    Wpisz token API z dash.cloudflare.com/profile/api-tokens:" -ForegroundColor Yellow
    $ApiToken = Read-Host "    Token"
}

$Headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type"  = "application/json"
}

# --- Krok 1: Sprawdz / stworz projekt ---
Write-Host "[1/3] Sprawdzam projekt Cloudflare Pages '$ProjectName'..." -ForegroundColor White
$ProjectUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName"

try {
    $proj = Invoke-RestMethod -Uri $ProjectUrl -Headers $Headers -Method GET -ErrorAction Stop
    Write-Host "  [OK] Projekt istnieje: $($proj.result.subdomain)" -ForegroundColor Green
} catch {
    Write-Host "  [..] Projekt nie istnieje - tworze nowy..." -ForegroundColor Yellow
    $body = @{ name = $ProjectName; production_branch = "main" } | ConvertTo-Json
    try {
        $proj = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects" `
            -Headers $Headers -Method POST -Body $body -ErrorAction Stop
        Write-Host "  [OK] Projekt '$ProjectName' stworzony!" -ForegroundColor Green
    } catch {
        Write-Host "  [BLAD] Nie mozna stworzyc projektu: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Sprawdz czy token API ma uprawnienia: Cloudflare Pages:Edit" -ForegroundColor Red
        Read-Host "Nacisnij Enter aby zamknac"
        exit 1
    }
}

# --- Krok 2: Stworz deployment z plikami ---
Write-Host ""
Write-Host "[2/3] Przygotowuje pliki do uploadu..." -ForegroundColor White

$files = @("index.html", "styles.css", "app.js")
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

# Buduj multipart/form-data z manifestem plikow
$manifest = @{}
$bodyLines = [System.Collections.Generic.List[byte]]()

$enc = [System.Text.Encoding]::UTF8

foreach ($f in $files) {
    $fp = Join-Path $SiteDir $f
    if (-not (Test-Path $fp)) {
        Write-Host "  [!] Brak pliku: $fp - pomijam" -ForegroundColor Yellow
        continue
    }
    $hash = (Get-FileHash $fp -Algorithm SHA256).Hash.ToLower()
    $manifest["/$f"] = $hash
    Write-Host "  [OK] $f ($hash)" -ForegroundColor Green
}

# Zapisz manifest jako JSON
$manifestJson = $manifest | ConvertTo-Json -Compress

# Buduj multipart body
$bodyBuilder = New-Object System.Text.StringBuilder
$fileBytes = [System.Collections.Generic.Dictionary[string,byte[]]]::new()

foreach ($f in $files) {
    $fp = Join-Path $SiteDir $f
    if (Test-Path $fp) {
        $fileBytes[$f] = [System.IO.File]::ReadAllBytes($fp)
    }
}

# Uzyj Direct Upload v2 - najpierw pobierz upload URL
Write-Host ""
Write-Host "[3/3] Uploaduje pliki na Cloudflare Pages..." -ForegroundColor White

$deployUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/deployments"

# Buduj form-data recznie
$bodyStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($bodyStream)

function Write-Part($name, $content, $filename=$null) {
    $header = "--$boundary$LF"
    if ($filename) {
        $header += "Content-Disposition: form-data; name=`"$name`"; filename=`"$filename`"$LF"
        $header += "Content-Type: application/octet-stream$LF"
    } else {
        $header += "Content-Disposition: form-data; name=`"$name`"$LF"
        $header += "Content-Type: application/json$LF"
    }
    $header += $LF
    $writer.Write($enc.GetBytes($header))
    if ($content -is [byte[]]) {
        $writer.Write($content)
    } else {
        $writer.Write($enc.GetBytes($content))
    }
    $writer.Write($enc.GetBytes($LF))
}

Write-Part "manifest" $manifestJson

foreach ($f in $files) {
    $fp = Join-Path $SiteDir $f
    if (Test-Path $fp) {
        $bytes = [System.IO.File]::ReadAllBytes($fp)
        Write-Part "/$f" $bytes $f
    }
}

$writer.Write($enc.GetBytes("--$boundary--$LF"))
$writer.Flush()
$multipartBytes = $bodyStream.ToArray()

$deployHeaders = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type"  = "multipart/form-data; boundary=$boundary"
}

try {
    $response = Invoke-RestMethod `
        -Uri $deployUrl `
        -Method POST `
        -Headers $deployHeaders `
        -Body $multipartBytes `
        -ErrorAction Stop

    $url = $response.result.url
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "  SUKCES! Strona jest online!" -ForegroundColor Green
    Write-Host "  URL: $url" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nastepny krok: przypnij domeny wakeandroll.pl i wakeandrollpark.pl" -ForegroundColor Cyan
    Write-Host "w Cloudflare DNS aby wskazywaly na ten deployment." -ForegroundColor Cyan
    Start-Process $url

} catch {
    Write-Host ""
    Write-Host "[BLAD] Nie udalo sie wgrac plikow:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Sprobuj recznie przez: https://dash.cloudflare.com/" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Nacisnij Enter aby zamknac"
