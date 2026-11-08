$ErrorActionPreference = 'Stop'
$root = 'C:\ak\akulyonok'
$fontDir = Join-Path $root 'assets\fonts'
New-Item -ItemType Directory -Force -Path $fontDir | Out-Null

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
$api = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Nunito:wght@400;600;700&display=swap'

$css = (Invoke-WebRequest -Uri $api -UserAgent $ua -UseBasicParsing).Content
Set-Content -Path (Join-Path $fontDir 'google.css') -Value $css -Encoding UTF8

# download every woff2 referenced by the css and rewrite it to a local path
$out = $css
$matches = [regex]::Matches($css, 'url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)')
$seen = @{}
foreach ($m in $matches) {
  $url = $m.Groups[1].Value
  if ($seen.ContainsKey($url)) { continue }
  $seen[$url] = $true
  $name = ($url -split '/')[-1]
  $local = Join-Path $fontDir $name
  Invoke-WebRequest -Uri $url -UserAgent $ua -OutFile $local -UseBasicParsing
  $out = $out.Replace($url, "fonts/$name")
}
Set-Content -Path (Join-Path $root 'assets\fonts.css') -Value $out -Encoding UTF8

Write-Output "fonts downloaded: $((Get-ChildItem $fontDir -Filter *.woff2).Count)"

# tabler icons (MIT), one family, 24x24 outline, stroke 2
$iconDir = Join-Path $root 'assets\icons'
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
$icons = @('droplet','users','waves','shield-check','phone','map-pin','clock','check','menu-2','brand-vk','brand-telegram','brand-instagram','arrow-up-right')
foreach ($icon in $icons) {
  $url = "https://unpkg.com/@tabler/icons@3.31.0/icons/outline/$icon.svg"
  try {
    $svg = (Invoke-WebRequest -Uri $url -UserAgent $ua -UseBasicParsing).Content
    Set-Content -Path (Join-Path $iconDir "$icon.svg") -Value $svg -Encoding UTF8
  } catch {
    Write-Output "FAILED: $icon -> $($_.Exception.Message)"
  }
}
Write-Output "icons downloaded: $((Get-ChildItem $iconDir -Filter *.svg).Count)"
