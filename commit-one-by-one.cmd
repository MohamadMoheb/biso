cd "C:\Users\Mohamad Moheb\Desktop\biso"

$skip = @('\.env$', '\.htpasswd$', 'credentials')

$entries = git status --porcelain -z
if (-not $entries) { Write-Host "Nothing to commit."; exit 0 }

$paths = New-Object System.Collections.Generic.List[string]
$parts = $entries -split "`0" | Where-Object { $_ -ne "" }

$i = 0
while ($i -lt $parts.Count) {
  $line = $parts[$i]
  $status = $line.Substring(0, 2)
  $path = $line.Substring(3)

  # Renames/copies: next record is the "from" path — skip it after taking "to"
  if ($status -match '^[R|C]') {
    $i++
  }

  $shouldSkip = $false
  foreach ($re in $skip) {
    if ($path -match $re) { $shouldSkip = $true; break }
  }
  if (-not $shouldSkip) { [void]$paths.Add($path) }
  $i++
}

Write-Host ("Committing {0} path(s) one-by-one..." -f $paths.Count)

foreach ($path in $paths) {
  git add -A -- $path
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL add: $path"
    continue
  }

  # Detect if this path is a deletion in the index/worktree
  $staged = git diff --cached --name-status -- $path
  $action = if ($staged -match '^D\s') { 'Remove' }
            elseif ($staged -match '^A\s') { 'Add' }
            else { 'Update' }

  git commit -m "$action $path"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "SKIP commit (nothing staged?): $path"
    git reset HEAD -- $path 2>$null | Out-Null
  } else {
    Write-Host "OK: $action $path"
  }
}

Write-Host "`nPushing all commits..."
git push -u origin main
