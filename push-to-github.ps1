Set-Location -Path $PSScriptRoot

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   WAKE & ROLL PARK -> GITHUB REPO CREATOR   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Inicjalizacja lokalnego repozytorium git..." -ForegroundColor White
    git init
    git config user.name "Mateusz Gaworski"
    git config user.email "mat.gaworski@gmail.com"
} else {
    Write-Host "[1/4] Repozytorium git juz zainicjalizowane." -ForegroundColor Green
}

Write-Host "[2/4] Dodawanie plikow strony..." -ForegroundColor White
git add index.html styles.css app.js .htaccess README.md .gitignore
git commit -m "Wdrozenie Wake and Roll Park Lodz - Pelna strona www"

Write-Host "[3/4] Sprawdzanie polaczenia z GitHub (gh)..." -ForegroundColor White
$repoExists = (gh repo view wake-and-roll-park 2>&1) -notmatch "Could not resolve to a Repository"

if (-not $repoExists) {
    Write-Host "[4/4] Tworzenie publicznego repozytorium 'wake-and-roll-park' na GitHub..." -ForegroundColor Yellow
    gh repo create wake-and-roll-park --public --source=. --remote=origin --push
} else {
    Write-Host "[4/4] Repozytorium istnieje - wysylanie najnowszego kodu (push)..." -ForegroundColor Yellow
    git push -u origin main
    if ($LASTEXITCODE -ne 0) {
        git push -u origin master
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   SUKCES! Projekt znajduje sie na GitHubie! " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
gh repo view wake-and-roll-park --web
