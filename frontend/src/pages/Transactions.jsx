$file = "C:\Users\Admin\OneDrive\Documents\Environment\ayende-cx-register\frontend\src\pages\Transactions.jsx"
$content = Get-Content $file -Raw
$pattern = "const formatCurrency = \(amount\) => \{\s*\r?\n\s*return new Intl\.NumberFormat\('en-US', \{\s*\r?\n\s*style: 'currency',\s*\r?\n\s*currency: 'USD'\s*\r?\n\s*\}\)\.format\(parseFloat\(amount\) \|\| 0\);\s*\r?\n\s*\};"
$content = $content -replace $pattern, ""
Set-Content $file $content -NoNewline
Write-Host "Fixed Transactions.jsx"
