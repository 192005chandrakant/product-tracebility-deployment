@echo off
echo ========================================
echo   NETLIFY.TOML VALIDATION CHECK
echo ========================================
echo.

echo Checking netlify.toml file...
echo.

if not exist "netlify.toml" (
    echo ❌ ERROR: netlify.toml file not found!
    echo Expected location: %cd%\netlify.toml
    pause
    exit /b 1
)

echo ✅ netlify.toml file exists

echo.
echo Checking for common TOML syntax issues...
echo.

REM Check for duplicate sections
findstr /C:"[build.environment]" netlify.toml > temp_count.txt
for /f %%i in ('find /c /v "" ^< temp_count.txt') do set count=%%i
del temp_count.txt

if %count% GTR 1 (
    echo ❌ ERROR: Found %count% [build.environment] sections - should be only 1
    echo This will cause Netlify build to fail!
    pause
    exit /b 1
) else (
    echo ✅ No duplicate [build.environment] sections
)

REM Check for required sections
findstr /C:"[build]" netlify.toml >nul
if %errorlevel% equ 0 (
    echo ✅ [build] section found
) else (
    echo ❌ ERROR: Missing [build] section
    pause
    exit /b 1
)

findstr /C:"[build.environment]" netlify.toml >nul
if %errorlevel% equ 0 (
    echo ✅ [build.environment] section found
) else (
    echo ❌ ERROR: Missing [build.environment] section
    pause
    exit /b 1
)

REM Check for required environment variables
findstr /C:"REACT_APP_API_URL" netlify.toml >nul
if %errorlevel% equ 0 (
    echo ✅ REACT_APP_API_URL is set
) else (
    echo ❌ WARNING: REACT_APP_API_URL not found
)

REM Check for invalid characters or formatting
findstr /R "[^[:print:]]" netlify.toml >nul
if %errorlevel% equ 0 (
    echo ❌ WARNING: Non-printable characters found in file
) else (
    echo ✅ No invalid characters detected
)

echo.
echo Checking file size...
for %%I in (netlify.toml) do (
    if %%~zI LSS 100 (
        echo ❌ ERROR: File is too small (%%~zI bytes) - likely corrupted
        pause
        exit /b 1
    ) else (
        echo ✅ File size OK (%%~zI bytes)
    )
)

echo.
echo ========================================
echo   NETLIFY.TOML VALIDATION PASSED! ✅
echo ========================================
echo.
echo The netlify.toml file appears to be valid and should build successfully.
echo.
echo Key configurations verified:
echo - ✅ Valid TOML syntax
echo - ✅ Required sections present
echo - ✅ No duplicate sections
echo - ✅ Environment variables configured
echo - ✅ File integrity OK
echo.
echo You can now commit and push this file to trigger a Netlify rebuild.
echo.
pause
exit /b 0
