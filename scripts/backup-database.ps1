param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"
if (-not $env:DATABASE_URL) { throw "DATABASE_URL is required." }

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $OutputDirectory "vju-tech-$timestamp.dump"

pg_dump --format=custom --file=$outputFile $env:DATABASE_URL
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }

Write-Output "Database backup created: $outputFile"
