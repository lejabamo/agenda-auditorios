$headers = @{ "Content-Type" = "application/json" }
$body = '{"test":"ok"}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/eventos/" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Body: $errBody" -ForegroundColor Yellow
    }
}
