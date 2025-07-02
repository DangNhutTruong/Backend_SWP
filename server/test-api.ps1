# PowerShell API Test Script
$baseUrl = "http://localhost:5000"

Write-Host "🚀 Testing NoSmoke Backend APIs" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host ($healthResponse | ConvertTo-Json -Compress)
}
catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: User Registration
Write-Host "`n2️⃣ Testing User Registration..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$registerData = @{
    username  = "testuser_$timestamp"
    email     = "test_$timestamp@example.com"
    password  = "password123"
    full_name = "Test User $timestamp"
    role      = "smoker"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "✅ Registration: " -ForegroundColor Green -NoNewline
    Write-Host ($registerResponse | ConvertTo-Json -Compress)
    
    # Test 3: User Login
    Write-Host "`n3️⃣ Testing User Login..." -ForegroundColor Yellow
    $loginData = @{
        email    = "test_$timestamp@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login: " -ForegroundColor Green -NoNewline
    Write-Host ($loginResponse | ConvertTo-Json -Compress)
    
    $token = $loginResponse.token
    $headers = @{ Authorization = "Bearer $token" }
    
    # Test 4: Protected Route (User Profile)
    Write-Host "`n4️⃣ Testing Protected Route (User Profile)..." -ForegroundColor Yellow
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method GET -Headers $headers
    Write-Host "✅ User Profile: " -ForegroundColor Green -NoNewline
    Write-Host ($profileResponse | ConvertTo-Json -Compress)
    
}
catch {
    Write-Host "❌ Registration/Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Public Endpoints
Write-Host "`n5️⃣ Testing Public Endpoints..." -ForegroundColor Yellow

$publicEndpoints = @(
    "/api/packages",
    "/api/achievements", 
    "/api/coaches",
    "/api/quit-plans"
)

foreach ($endpoint in $publicEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method GET
        Write-Host "✅ $endpoint : " -ForegroundColor Green -NoNewline
        Write-Host "OK ($(($response | ConvertTo-Json -Compress).Length) chars)"
    }
    catch {
        Write-Host "❌ $endpoint : Failed" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
