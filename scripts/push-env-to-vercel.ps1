# Reads .env.local and pushes each var to Vercel (Development environment).
# Run from the project root: .\scripts\push-env-to-vercel.ps1

$skip = @('VERCEL_OIDC_TOKEN', 'SANDBOX_APPLICATION_ID')
# ASCII has no BOM — safest encoding for piping values to native processes
$OutputEncoding = [System.Text.Encoding]::ASCII

Get-Content .env.local -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim().TrimStart([char]0xFEFF)
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    $eqIdx = $line.IndexOf('=')
    if ($eqIdx -lt 1) { return }
    $name  = $line.Substring(0, $eqIdx).Trim()
    $value = $line.Substring($eqIdx + 1).Trim().TrimStart([char]0xFEFF)
    if ($skip -contains $name) { return }
    if ($value -eq '') { return }

    Write-Host "Adding $name ..."
    $value | npx vercel env add $name development --force
}

Write-Host "`nDone. Run 'vercel env pull .env.local' to verify."
