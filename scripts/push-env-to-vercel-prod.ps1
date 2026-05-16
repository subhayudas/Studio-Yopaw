# Reads .env.local and pushes each var to Vercel (Production environment).
# Run from the project root: .\scripts\push-env-to-vercel-prod.ps1

$skip = @('VERCEL_OIDC_TOKEN', 'SANDBOX_APPLICATION_ID')
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
    $value | npx vercel env add $name production --force
}

Write-Host "`nDone. Run 'vercel env ls' to verify."
