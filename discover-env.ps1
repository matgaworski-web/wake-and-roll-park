Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   ENVIRONMENT & EXISTING PROJECTS DISCOVERY     " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Sprawdz narzedzia systemowe
Write-Host "--- 1. Dostepne narzedzia CLI ---" -ForegroundColor Yellow
$tools = @("git", "gh", "ssh", "scp", "node", "npm", "npx", "wrangler", "docker", "python", "curl")
foreach ($t in $tools) {
    $cmd = Get-Command $t -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Host "  [OK] $t -> $($cmd.Source)" -ForegroundColor Green
    } else {
        Write-Host "  [--] $t -> Brak w PATH" -ForegroundColor DarkGray
    }
}

# 2. Zmienne srodowiskowe (klucze)
Write-Host ""
Write-Host "--- 2. Zmienne srodowiskowe (związane z Cloudflare / OVH / serwerem) ---" -ForegroundColor Yellow
Get-ChildItem env: | Where-Object { 
    $_.Name -match "CLOUDFLARE|OVH|SSH|SERVER|HOST|IP|DEPLOY|TOKEN|KEY|SECRET|R2|PAGES" 
} | ForEach-Object {
    $val = $_.Value
    if ($val.Length -gt 8) {
        $masked = $val.Substring(0, 4) + "..." + $val.Substring($val.Length - 4)
    } else {
        $masked = "***"
    }
    Write-Host "  $($_.Name) = $masked" -ForegroundColor Cyan
}

# 3. Istniejace projekty w scratch
Write-Host ""
Write-Host "--- 3. Projekty w C:\Users\user\.gemini\antigravity\scratch ---" -ForegroundColor Yellow
$scratchDir = "C:\Users\user\.gemini\antigravity\scratch"
if (Test-Path $scratchDir) {
    Get-ChildItem -Path $scratchDir -Directory | ForEach-Object {
        Write-Host "  Folder: $($_.Name)" -ForegroundColor Green
    }
}

# 4. Sprawdz katalogi uzytkownika i .ssh
Write-Host ""
Write-Host "--- 4. Konfiguracje w katalogu domowym uzytkownika ---" -ForegroundColor Yellow
$sshDir = "C:\Users\user\.ssh"
if (Test-Path $sshDir) {
    Write-Host "  Znaleziono .ssh:" -ForegroundColor Green
    Get-ChildItem -Path $sshDir | ForEach-Object {
        Write-Host "    $($_.Name) (Rozmiar: $($_.Length) B)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  Brak folderu .ssh" -ForegroundColor DarkGray
}

# 5. Sprawdz git config
Write-Host ""
Write-Host "--- 5. Globalna konfiguracja Git ---" -ForegroundColor Yellow
git config --list --global 2>&1 | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Cyan
}
