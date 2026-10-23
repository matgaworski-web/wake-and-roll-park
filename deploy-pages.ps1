$env:CLOUDFLARE_ACCOUNT_ID = "26e9a9b548af169e0537cc7c404ed827"
$dir = "C:\Users\user\.gemini\antigravity\scratch\wake-and-roll-park"

Write-Host "Wgrywanie strony na Cloudflare Pages..." -ForegroundColor Cyan
npx wrangler pages deploy $dir --project-name=wakeandrollpark --branch=main --commit-dirty=true
