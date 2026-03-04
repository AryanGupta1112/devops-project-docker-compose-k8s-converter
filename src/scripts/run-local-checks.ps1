Write-Host "Running backend tests..."
npm test

Write-Host "Running frontend build..."
npm --prefix src/main/frontend run build
