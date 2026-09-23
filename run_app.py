import os
import sys
import subprocess
import webbrowser
import time

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")

def print_header(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")

def run_command(cmd, cwd=None):
    print(f"Running: {cmd} (in {cwd or os.getcwd()})")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Command failed with code {res.returncode}")
        return False
    return True

def main():
    print_header("AI INTERVIEW PREPARATION SYSTEM - 1-CLICK LAUNCHER")

    # Step 1: Install Backend Python Requirements
    print("[1/3] Checking and installing Python backend dependencies...")
    req_file = os.path.join(BACKEND_DIR, "requirements.txt")
    if os.path.exists(req_file):
        run_command(f'"{sys.executable}" -m pip install -r "{req_file}"', cwd=BACKEND_DIR)

    # Step 2: Install Frontend npm packages and build static bundle
    print("\n[2/3] Checking Frontend node modules & building Web UI...")
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    dist_dir = os.path.join(FRONTEND_DIR, "dist")
    
    # Check if npm is available
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    if not os.path.exists(node_modules):
        print("Installing frontend packages via npm...")
        run_command(f"{npm_cmd} install", cwd=FRONTEND_DIR)

    if not os.path.exists(dist_dir):
        print("Building production static bundle...")
        run_command(f"{npm_cmd} run build", cwd=FRONTEND_DIR)

    # Step 3: Launch Flask Backend Server
    print_header("STARTING APPLICATION SERVER")
    print("Backend & Frontend available at: http://127.0.0.1:5000")
    print("Opening browser automatically in 3 seconds...\n")

    time.sleep(2)
    webbrowser.open("http://127.0.0.1:5000")

    app_py = os.path.join(BACKEND_DIR, "app.py")
    subprocess.run(f'"{sys.executable}" "{app_py}"', shell=True, cwd=BACKEND_DIR)

if __name__ == "__main__":
    main()
