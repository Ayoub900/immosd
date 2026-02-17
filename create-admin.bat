@echo off
REM Script to create an admin user
REM Usage: create-admin.bat admin@example.com yourpassword "Your Name"

if "%~1"=="" (
    echo Error: Email is required
    echo Usage: create-admin.bat admin@example.com yourpassword "Your Name"
    exit /b 1
)

if "%~2"=="" (
    echo Error: Password is required
    echo Usage: create-admin.bat admin@example.com yourpassword "Your Name"
    exit /b 1
)

set ADMIN_EMAIL=%~1
set ADMIN_PASSWORD=%~2
if NOT "%~3"=="" set ADMIN_NAME=%~3

node --import tsx scripts/create-admin-user.ts
