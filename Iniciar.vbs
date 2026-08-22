Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "http://localhost:3000"
WshShell.Run "cmd /k cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npm run dev", 1, False
