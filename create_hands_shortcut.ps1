# -------------------------------------------------
# Hands Protocol – Desktop Shortcut Creator (PowerShell)
# -------------------------------------------------
# This script creates a shortcut on the current user's Desktop
# that launches the start_hands.bat batch file.

# Path to the batch file you want to run
$batchPath = "C:\Y-OS\Y-IT_ENGINES\HANDS\start_hands.bat"

# Resolve the Desktop folder for the current user
$desktop = [Environment]::GetFolderPath('Desktop')

# Shortcut file name (you can change the display name here)
$shortcutPath = Join-Path $desktop "HandsProtocol.lnk"

# Create a COM object for shortcut handling
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)

# Set the target (the batch file) and working directory
$shortcut.TargetPath = $batchPath
$shortcut.WorkingDirectory = Split-Path $batchPath

# Optional: set an icon – you can point to any .ico file you like
# Example: use the Node.js icon if you have it, otherwise omit
# $shortcut.IconLocation = "C:\Program Files\nodejs\node.exe,0"

# Set a friendly description (tooltip)
$shortcut.Description = "Launch Hands Protocol server and open the UI in your browser."

# Save the shortcut
$shortcut.Save()

Write-Host "✅ Shortcut created on Desktop: $shortcutPath"
