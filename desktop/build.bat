@echo off
echo ========================================
echo   Building IronFuel Desktop App...
echo ========================================
echo.

py -m PyInstaller ^
    --onefile ^
    --windowed ^
    --name "IronFuel" ^
    --icon "icon.ico" ^
    --add-data "icon.ico;." ^
    --clean ^
    ironfuel.py

echo.
if exist "dist\IronFuel.exe" (
    echo ========================================
    echo   BUILD SUCCESS!
    echo   Output: dist\IronFuel.exe
    echo ========================================
    echo.
    echo Copying to Desktop...
    copy "dist\IronFuel.exe" "%USERPROFILE%\Desktop\IronFuel.exe"
    echo Done! IronFuel.exe is on your Desktop.
) else (
    echo BUILD FAILED - check output above
)
pause
