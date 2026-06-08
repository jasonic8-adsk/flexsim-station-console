#Requires -Version 5.1
<#
.SYNOPSIS
  Checks and sets up the local FlexSim Station Console development environment.

.DESCRIPTION
  1. Audits system tools (Node.js, Docker, SAM CLI, Git) and project artifacts.
  2. Optionally installs missing system packages via winget.
  3. Optionally installs npm dependencies, builds SAM artifacts, and starts DynamoDB Local.

.PARAMETER CheckOnly
  Only run the prerequisite check. No installs or project setup.

.PARAMETER InstallSystem
  Install missing system packages with winget (Node.js, Docker Desktop, SAM CLI, Git).

.PARAMETER SetupProject
  Install npm dependencies, run build, and set up DynamoDB Local + table.

.PARAMETER All
  Equivalent to -InstallSystem -SetupProject.

.EXAMPLE
  npm run setup:check

.EXAMPLE
  npm run setup:local

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/setup-local-env.ps1 -InstallSystem
#>
[CmdletBinding()]
param(
  [switch]$CheckOnly,
  [switch]$InstallSystem,
  [switch]$SetupProject,
  [switch]$All
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if ($All) {
  $InstallSystem = $true
  $SetupProject = $true
}

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-ProjectCommand([string]$Label, [string]$Command) {
  Write-Step $Label
  Write-Host $Command -ForegroundColor DarkGray
  Invoke-Expression $Command
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command"
  }
}

function Get-CheckResults {
  $output = & node "scripts/check-local-prereqs.cjs" --json | Out-String
  return $output | ConvertFrom-Json
}

function Test-WingetAvailable {
  return [bool](Get-Command winget -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
  param(
    [string]$Id,
    [string]$Label
  )

  Write-Host "Installing $Label ($Id)..." -ForegroundColor Yellow
  winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget install failed for $Id"
  }
}

$SystemPackages = @(
  @{ Id = "OpenJS.NodeJS.LTS"; CheckId = "node"; Label = "Node.js LTS" },
  @{ Id = "Docker.DockerDesktop"; CheckId = "docker"; Label = "Docker Desktop" },
  @{ Id = "Amazon.SAM-CLI"; CheckId = "sam"; Label = "AWS SAM CLI" },
  @{ Id = "Git.Git"; CheckId = "git"; Label = "Git" }
)

Write-Step "Checking local prerequisites"
$results = Get-CheckResults
$results.checks | ForEach-Object {
  $status = if ($_.ok) { "OK" } else { "MISS" }
  $required = if ($_.required) { "" } else { " (optional)" }
  Write-Host ("[{0}] {1}{2}" -f $status, $_.id, $required)
}

if ($CheckOnly -or (-not $InstallSystem -and -not $SetupProject)) {
  if ($results.totals.ready) {
    Write-Host "`nEnvironment is ready." -ForegroundColor Green
    Write-Host "Start local dev with: npm run dev"
    exit 0
  }

  Write-Host "`nEnvironment is not fully ready." -ForegroundColor Yellow
  Write-Host "Run one of:"
  Write-Host "  npm run setup:local              # install missing tools + project setup"
  Write-Host "  npm run setup:local:install      # install missing system tools only"
  Write-Host "  npm run setup:local:project      # project dependencies/build/db only"
  exit 1
}

$installedSystemPackages = @()

if ($InstallSystem) {
  if (-not (Test-WingetAvailable)) {
    throw "winget is not available. Install packages manually, then rerun setup."
  }

  $missingSystem = $results.checks |
    Where-Object { $_.category -eq "system" -and -not $_.ok } |
    ForEach-Object { $_.id }

  foreach ($package in $SystemPackages) {
    if ($missingSystem -contains $package.CheckId) {
      Install-WingetPackage -Id $package.Id -Label $package.Label
      $installedSystemPackages += $package.Label
    }
  }

  Write-Host ""
  Write-Host "System package installs finished." -ForegroundColor Green
  if ($installedSystemPackages.Count -gt 0) {
    Write-Host "Installed: $($installedSystemPackages -join ', ')"
    Write-Host "Open a NEW terminal so PATH updates apply."
    Write-Host "If Docker Desktop was installed, start it and wait until it reports Running."
    Write-Host "Then run: npm run setup:local:project"
  }
}

if ($SetupProject) {
  if ($installedSystemPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "Skipping project setup in this session because system packages were just installed." -ForegroundColor Yellow
    exit 0
  }

  $dockerCheck = $results.checks | Where-Object { $_.id -eq "docker" } | Select-Object -First 1
  if ($dockerCheck -and -not $dockerCheck.ok) {
    throw "Docker is not ready. Start Docker Desktop, then rerun: npm run setup:local:project"
  }

  Invoke-ProjectCommand "Installing root npm dependencies" "npm install"
  Invoke-ProjectCommand "Installing backend npm dependencies" "npm run install:backend"
  Invoke-ProjectCommand "Building SAM local artifacts" "npm run build"
  Invoke-ProjectCommand "Starting DynamoDB Local and creating table" "npm run db:setup"

  Write-Step "Re-checking environment"
  & node "scripts/check-local-prereqs.cjs"
  exit $LASTEXITCODE
}

exit 0
