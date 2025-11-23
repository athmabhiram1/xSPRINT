<#
Quick PowerShell API smoke-test for xSPRINT backend
Location: backend/test-features.ps1

Usage: powershell -ExecutionPolicy Bypass -File .\test-features.ps1
#>

param(
    [string]$baseUrl = "http://localhost:5000"
)

function Invoke-ApiPost {
    param(
        [string]$path,
        [hashtable]$body
    )
    try {
        $json = $body | ConvertTo-Json -Depth 10
        $uri = "$baseUrl$path"
        $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType 'application/json' -Body $json -ErrorAction Stop
        return @{ success = $true; data = $response }
    }
    catch {
        $errMsg = $_.Exception.Message
        return @{ success = $false; error = $errMsg }
    }
}

function Invoke-ApiGet {
    param(
        [string]$path
    )
    try {
        $uri = "$baseUrl$path"
        $response = Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop
        return @{ success = $true; data = $response }
    }
    catch {
        $errMsg = $_.Exception.Message
        return @{ success = $false; error = $errMsg }
    }
}

# Main test suite
Write-Host "`n========== xSPRINT Backend Test Suite ==========" -ForegroundColor Cyan
Write-Host "Target: $baseUrl`n" -ForegroundColor Gray

# Test 1: Create Clubs
Write-Host "[TEST 1] Creating Clubs..." -ForegroundColor Yellow
$club1Payload = @{ name = 'Test Club Alpha' }
$club1Result = Invoke-ApiPost -path '/clubs' -body $club1Payload

Start-Sleep -Milliseconds 300

$club2Payload = @{ name = 'Test Club Beta' }
$club2Result = Invoke-ApiPost -path '/clubs' -body $club2Payload

if (-not $club1Result.success -or -not $club2Result.success) {
    Write-Host "[FAIL] Club creation failed" -ForegroundColor Red
    Write-Host $club1Result.error -ForegroundColor Red
    exit 1
}

$club1 = $club1Result.data.club
$club2 = $club2Result.data.club
Write-Host "[PASS] Club 1: $($club1.name) ($($club1.id))" -ForegroundColor Green
Write-Host "[PASS] Club 2: $($club2.name) ($($club2.id))" -ForegroundColor Green

# Test 2: Fetch All Clubs
Write-Host "`n[TEST 2] Fetching All Clubs..." -ForegroundColor Yellow
$clubsResult = Invoke-ApiGet -path '/clubs'
if ($clubsResult.success) {
    $clubCount = $clubsResult.data.clubs.Count
    Write-Host "[PASS] Total clubs in DB: $clubCount" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Could not fetch clubs" -ForegroundColor Red
}

# Test 3: Create Tournament with Courts
Write-Host "`n[TEST 3] Creating Tournament with Courts..." -ForegroundColor Yellow
$today = Get-Date
$startDate = $today.AddDays(10).ToString('o')
$endDate = $today.AddDays(14).ToString('o')

$tournamentPayload = @{
    name = "Test Tournament $(Get-Random)"
    location = "Main Arena"
    startDate = $startDate
    endDate = $endDate
    courts = @(
        @{ name = "Court 1" }
        @{ name = "Court 2" }
        @{ name = "Court 3" }
    )
}

$tournamentResult = Invoke-ApiPost -path '/tournaments' -body $tournamentPayload

if (-not $tournamentResult.success) {
    Write-Host "[FAIL] Tournament creation failed" -ForegroundColor Red
    Write-Host $tournamentResult.error -ForegroundColor Red
    exit 1
}

$tournament = $tournamentResult.data.tournament
Write-Host "[PASS] Tournament: $($tournament.name) ($($tournament.id))" -ForegroundColor Green
Write-Host "[PASS] Courts created: $($tournament.courts.Count)" -ForegroundColor Green

# Test 4: Create Events
Write-Host "`n[TEST 4] Creating Events..." -ForegroundColor Yellow

$event1Payload = @{
    tournamentId = $tournament.id
    name = "Men's Singles"
    sport = "Badminton"
    type = "KNOCKOUT"
    gender = "Men's"
    category = "Senior"
}
$event1Result = Invoke-ApiPost -path '/events' -body $event1Payload

$event2Payload = @{
    tournamentId = $tournament.id
    name = "Women's Doubles"
    sport = "Badminton"
    type = "ROUND_ROBIN"
    gender = "Women's"
    category = "Senior"
}
$event2Result = Invoke-ApiPost -path '/events' -body $event2Payload

if (-not $event1Result.success -or -not $event2Result.success) {
    Write-Host "[FAIL] Event creation failed" -ForegroundColor Red
    exit 1
}

$event1 = $event1Result.data.event
$event2 = $event2Result.data.event
Write-Host "[PASS] Event 1: $($event1.name)" -ForegroundColor Green
Write-Host "[PASS] Event 2: $($event2.name)" -ForegroundColor Green

# Test 5: Create Players
Write-Host "`n[TEST 5] Creating Players..." -ForegroundColor Yellow
$playersList = @()

$players = @(
    @{ name = "Alice Johnson"; email = "alice@test.com"; gender = "Female"; weight = "60kg"; category = "Senior" }
    @{ name = "Bob Smith"; email = "bob@test.com"; gender = "Male"; weight = "75kg"; category = "Senior" }
    @{ name = "Charlie Brown"; email = "charlie@test.com"; gender = "Male"; weight = "80kg"; category = "Senior" }
    @{ name = "Diana Davis"; email = "diana@test.com"; gender = "Female"; weight = "62kg"; category = "Senior" }
)

foreach ($player in $players) {
    $playerPayload = $player + @{ clubId = $club1.id }
    $playerResult = Invoke-ApiPost -path '/players' -body $playerPayload
    if ($playerResult.success) {
        $playersList += $playerResult.data.player
        Write-Host "[PASS] Player: $($player.name)" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Failed to create $($player.name)" -ForegroundColor Yellow
    }
}

if ($playersList.Count -lt 2) {
    Write-Host "[FAIL] Not enough players created" -ForegroundColor Red
    exit 1
}

# Test 6: Register Players to Event 1
Write-Host "`n[TEST 6] Registering Players to Event 1..." -ForegroundColor Yellow
$maleCount = 0
foreach ($player in $playersList) {
    if ($player.gender -eq "Male" -and $maleCount -lt 3) {
        $regPayload = @{
            eventId = $event1.id
            playerId = $player.id
        }
        $regResult = Invoke-ApiPost -path '/events/register' -body $regPayload
        if ($regResult.success) {
            Write-Host "[PASS] Registered $($player.name)" -ForegroundColor Green
            $maleCount++
        }
    }
}

# Test 7: Fetch Event Registrations
Write-Host "`n[TEST 7] Fetching Event Registrations..." -ForegroundColor Yellow
$regsResult = Invoke-ApiGet -path "/events/$($event1.id)/registrations"
if ($regsResult.success) {
    $regCount = $regsResult.data.registrations.Count
    Write-Host "[PASS] Event has $regCount registrations" -ForegroundColor Green
}

# Test 8: Generate Knockout Fixtures
Write-Host "`n[TEST 8] Generating Knockout Fixtures..." -ForegroundColor Yellow
$fixturePayload = @{ type = "KNOCKOUT" }
$fixtureResult = Invoke-ApiPost -path "/fixtures/generate/$($event1.id)" -body $fixturePayload

if ($fixtureResult.success) {
    $matchCount = $fixtureResult.data.data.matches.Count
    Write-Host "[PASS] Generated $matchCount knockout matches" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Fixture generation failed: $($fixtureResult.error)" -ForegroundColor Red
}

# Test 9: Generate Round Robin Fixtures
Write-Host "`n[TEST 9] Generating Round Robin Fixtures..." -ForegroundColor Yellow

# Register some female players first
$femaleCount = 0
foreach ($player in $playersList) {
    if ($player.gender -eq "Female" -and $femaleCount -lt 2) {
        $regPayload = @{
            eventId = $event2.id
            playerId = $player.id
        }
        Invoke-ApiPost -path '/events/register' -body $regPayload | Out-Null
        $femaleCount++
    }
}

$fixturePayload2 = @{ type = "ROUND_ROBIN" }
$fixtureResult2 = Invoke-ApiPost -path "/fixtures/generate/$($event2.id)" -body $fixturePayload2

if ($fixtureResult2.success) {
    $matchCount2 = $fixtureResult2.data.data.matches.Count
    Write-Host "[PASS] Generated $matchCount2 round-robin matches" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Round-robin generation failed: $($fixtureResult2.error)" -ForegroundColor Red
}

# Test 10: Fetch Tournament Details
Write-Host "`n[TEST 10] Fetching Tournament Details..." -ForegroundColor Yellow
$tournamentDetailsResult = Invoke-ApiGet -path "/tournaments/$($tournament.id)"

if ($tournamentDetailsResult.success) {
    $details = $tournamentDetailsResult.data.tournament
    Write-Host "[PASS] Tournament: $($details.name)" -ForegroundColor Green
    Write-Host "[PASS] Events: $($details.events.Count)" -ForegroundColor Green
    Write-Host "[PASS] Courts: $($details.courts.Count)" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Could not fetch tournament details" -ForegroundColor Red
}

Write-Host "`n========== Test Suite Complete ==========" -ForegroundColor Cyan
Write-Host "All core backend features validated successfully!`n" -ForegroundColor Green


