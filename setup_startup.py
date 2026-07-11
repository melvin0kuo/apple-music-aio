import os
import sys
import subprocess

def create_startup_shortcut():
    python_exe = sys.executable
    # Resolve windowless pythonw.exe
    pythonw_exe = python_exe.replace("python.exe", "pythonw.exe")
    if not os.path.exists(pythonw_exe):
        pythonw_exe = python_exe

    server_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")
    working_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Resolve Windows Startup Folder
    appdata = os.environ.get("APPDATA")
    if not appdata:
        print("Error: APPDATA environment variable not found.", file=sys.stderr)
        return False
        
    startup_folder = os.path.join(appdata, r"Microsoft\Windows\Start Menu\Programs\Startup")
    shortcut_path = os.path.join(startup_folder, "AppleMusicAIO.lnk")

    # PowerShell script to create WScript shortcut
    ps_script = f"""
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("{shortcut_path}")
    $Shortcut.TargetPath = "{pythonw_exe}"
    $Shortcut.Arguments = '"{server_path}"'
    $Shortcut.WorkingDirectory = "{working_dir}"
    $Shortcut.Description = "Start Apple Music AIO Display Server Silently"
    $Shortcut.Save()
    """
    
    try:
        subprocess.run(["powershell", "-Command", ps_script], check=True, capture_output=True, text=True)
        print(f"Startup shortcut created successfully at: {shortcut_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Powershell error creating shortcut: {e.stderr}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error creating startup shortcut: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    create_startup_shortcut()
