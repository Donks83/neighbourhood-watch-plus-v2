@echo off
REM Quick Firebase Rules Deployment Script
echo.
echo ========================================
echo   Firebase Rules Deployment
echo ========================================
echo.
echo Deploying Firestore security rules...
echo.

firebase deploy --only firestore:rules

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Press any key to close...
pause > nul
