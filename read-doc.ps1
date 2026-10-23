Add-Type -AssemblyName System.IO.Compression.FileSystem
$f = Get-ChildItem -Path 'C:\Users\user\Desktop' -Filter '*WAKE.docx' | Select-Object -First 1
if ($f) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    $entry = $zip.GetEntry('word/document.xml')
    if ($entry) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $text = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $clean = $text -replace '<[^>]+>', ' ' -replace '\s+', ' '
        Write-Host "TRESC UMOWY:"
        Write-Host ($clean.Substring(0, [Math]::Min(1200, $clean.Length)))
    }
    $zip.Dispose()
}
