$files = Get-ChildItem -Path "u:\Inventory Managemnt System\inventory-app\src" -Recurse -Include "*.tsx","*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "InventoryPro") {
        $updated = $content -replace "InventoryPro", "FabricPro"
        Set-Content -Path $file.FullName -Value $updated -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Done."
