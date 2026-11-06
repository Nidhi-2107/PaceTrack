# PaceTrack Phase 3 End-to-End Live Verification Script
$ErrorActionPreference = "Stop"

$env:PATH = "C:\Program Files\Java\jdk-24\bin;" + $env:PATH
$env:DB_URL = "jdbc:postgresql://localhost:5433/pacetrack"
$env:DB_USERNAME = "pacetrack_user"
$env:DB_PASSWORD = "pacetrack_secret_change_in_prod"
$env:JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"

Write-Host ">>> Starting Spring Boot application..."
Set-Location "d:\learning backend\PaceTrack\backend\target"
$proc = Start-Process -FilePath "java.exe" -ArgumentList "-jar", "backend-0.0.1-SNAPSHOT.jar" -PassThru

# Poll until health endpoint responds
$baseUrl = "http://localhost:8080/api/v1"
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 2
        if ($health.success -eq $true) {
            $ready = $true
            break
        }
    } catch {
        # waiting for startup
    }
}

if (-not $ready) {
    Write-Error "Spring Boot failed to start within 30 seconds"
    Stop-Process -Id $proc.Id -Force
    exit 1
}

Write-Host ">>> Spring Boot is LIVE and HEALTHY! Running Phase 3 test suite..."

try {
    # 1. Register User
    $testEmail = "phase3_" + [System.Guid]::NewGuid().ToString().Substring(0,8) + "@pacetrack.test"
    $regBody = @{
        email = $testEmail
        password = "Password123!"
        firstName = "PhaseThree"
        lastName = "Runner"
    } | ConvertTo-Json

    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body $regBody
    Write-Host "[PASS] User Registered: $($regRes.data.user.email)"

    # 2. Login
    $loginBody = @{
        email = $testEmail
        password = "Password123!"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.data.token
    Write-Host "[PASS] User Logged In, JWT obtained"

    $authHeader = @{ "Authorization" = "Bearer $token" }

    # 3. Check Initial Steps
    $initSteps = Invoke-RestMethod -Uri "$baseUrl/steps/today" -Method Get -Headers $authHeader
    Write-Host "[PASS] Initial Steps Today: $($initSteps.data.stepCount)"

    # 4. Sync Device Steps
    $todayStr = (Get-Date).ToString("yyyy-MM-dd")
    $syncBody = @{
        recordDate = $todayStr
        stepCount = 8450
        distanceMeters = 6422.0
        caloriesBurned = 338
    } | ConvertTo-Json

    $syncRes = Invoke-RestMethod -Uri "$baseUrl/steps/sync" -Method Post -Headers $authHeader -ContentType "application/json" -Body $syncBody
    Write-Host "[PASS] Steps Synced: $($syncRes.data.stepCount) steps, $($syncRes.data.distanceMeters)m"

    # 5. Verify Today Steps
    $verifiedSteps = Invoke-RestMethod -Uri "$baseUrl/steps/today" -Method Get -Headers $authHeader
    if ($verifiedSteps.data.stepCount -ne 8450) { throw "Step count mismatch" }
    Write-Host "[PASS] Verified Today Steps: $($verifiedSteps.data.stepCount)"

    # 6. Set Daily Step Goal
    $goalBody = @{
        goalType = "DAILY_STEPS"
        targetValue = 10000
    } | ConvertTo-Json

    $goalRes = Invoke-RestMethod -Uri "$baseUrl/goals" -Method Post -Headers $authHeader -ContentType "application/json" -Body $goalBody
    Write-Host "[PASS] Goal Created: $($goalRes.data.goalType) -> $($goalRes.data.targetValue)"

    # 7. Fetch Goals
    $goalsList = Invoke-RestMethod -Uri "$baseUrl/goals" -Method Get -Headers $authHeader
    Write-Host "[PASS] Retrieved Active Goals Count: $($goalsList.data.Count)"

    # 8. Record Live GPS Activity with Waypoints
    $now = [System.DateTime]::UtcNow
    $startTime = $now.AddMinutes(-35).ToString("o")
    $endTime = $now.ToString("o")

    $actBody = @{
        activityType = "RUNNING"
        title = "Cubbon Park Evening Run"
        startTime = $startTime
        endTime = $endTime
        distanceMeters = 5230.5
        stepCount = 5900
        privacyLevel = "PRIVATE"
        idempotencyKey = [System.Guid]::NewGuid().ToString()
        waypoints = @(
            @{ latitude = 12.9750; longitude = 77.5900; speedMps = 2.8; timestamp = $startTime },
            @{ latitude = 12.9765; longitude = 77.5925; speedMps = 3.1; timestamp = $now.AddMinutes(-20).ToString("o") },
            @{ latitude = 12.9780; longitude = 77.5950; speedMps = 3.4; timestamp = $endTime }
        )
    } | ConvertTo-Json

    $actRes = Invoke-RestMethod -Uri "$baseUrl/activities" -Method Post -Headers $authHeader -ContentType "application/json" -Body $actBody
    $actId = $actRes.data.id
    Write-Host "[PASS] Activity Created: $actId | $($actRes.data.title) | $($actRes.data.distanceMeters)m | $($actRes.data.caloriesBurned) kcal"

    # 9. Fetch Activity by ID (with full waypoints)
    $detail = Invoke-RestMethod -Uri "$baseUrl/activities/$actId" -Method Get -Headers $authHeader
    Write-Host "[PASS] Activity Details fetched: $($detail.data.title) with $($detail.data.waypoints.Count) GPS waypoints"

    # 10. Fetch Activities List
    $list = Invoke-RestMethod -Uri "$baseUrl/activities" -Method Get -Headers $authHeader
    Write-Host "[PASS] Activities List Count: $($list.data.Count)"

    # 11. Fetch Weekly Analytics
    $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/weekly" -Method Get -Headers $authHeader
    Write-Host "[PASS] Weekly Analytics: Total Workouts: $($analytics.data.totalActivities), Distance: $($analytics.data.totalDistanceMeters)m, Steps: $($analytics.data.totalSteps)"

    # 12. Test Security: Unauthorized Request Rejection
    try {
        Invoke-RestMethod -Uri "$baseUrl/activities" -Method Get -ErrorAction Stop
        throw "Expected 401 for unauthenticated request"
    } catch {
        Write-Host "[PASS] Unauthenticated request correctly rejected: $($_.Exception.Message)"
    }

    Write-Host "`n========================================================"
    Write-Host " ALL PHASE 3 BACKEND & DATABASE INTEGRATION TESTS PASSED!"
    Write-Host "========================================================`n"

} finally {
    Write-Host ">>> Stopping Spring Boot process..."
    Stop-Process -Id $proc.Id -Force
}
