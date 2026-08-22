$port = 3000
$proc = netstat -ano | findstr ":$port " | Select-String "LISTENING"
if ($proc) {
    $pidNum = ($proc.ToString() -split '\s+')[-1]
    taskkill /F /PID $pidNum 2>$null
    Start-Sleep 2
}

Set-Location "$PSScriptRoot"
if (-not (Test-Path node_modules)) {
    npm install
}

Write-Host "Iniciando servidor..."
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node"
$psi.Arguments = "node_modules/next/dist/bin/next dev -p $port"
$psi.WorkingDirectory = "$PSScriptRoot"
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $false
$psi.WindowStyle = "Normal"
[System.Diagnostics.Process]::Start($psi)

Start-Sleep 5
Start-Process "http://localhost:$port"
