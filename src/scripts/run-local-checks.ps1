Write-Host "Running backend lint and tests..."
npm run lint
npm test

Write-Host "Running frontend lint and build..."
npm --prefix src/main/frontend run lint
npm --prefix src/main/frontend run build
