import os
import sys
import time
import subprocess
import webbrowser


def main():
    print("=" * 75)
    print("      METROSIGHT: CITY-WIDE MULTI-CAMERA ANPR + RE-ID DEMO SYSTEM      ")
    print("=" * 75)

    base_dir = os.path.dirname(os.path.abspath(__file__))

    venv_python = os.path.join(
        base_dir,
        "venv",
        "Scripts",
        "python.exe"
    )

    if not os.path.exists(venv_python):
        venv_python = sys.executable

    # 1. GENERATE SYNTHETIC MULTI-CAMERA MP4 VIDEOS
    print(
        "\n[STEP 1/4] Generating 8 Synthetic "
        "Multi-Camera MP4 Video Feeds..."
    )

    from backend.app.engine.video_generator import (
        generate_all_demo_videos
    )

    generate_all_demo_videos(
        output_dir=os.path.join(
            base_dir,
            "data",
            "videos"
        )
    )

    # 2. START AI FASTAPI SERVER ON PORT 8001
    # Your central backend is running separately on port 8000.
    print(
        "\n[STEP 2/4] Starting AI FastAPI Server "
        "on http://localhost:8001..."
    )

    backend_cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8001",
        "--reload"
    ]

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=os.path.join(
            base_dir,
            "backend"
        )
    )

    # 3. START VITE FRONTEND SERVER
    print(
        "\n[STEP 3/4] Starting React Frontend Server "
        "on http://localhost:5173..."
    )

    frontend_dir = os.path.join(
        base_dir,
        "frontend"
    )

    npm_cmd = (
        "npm.cmd"
        if sys.platform == "win32"
        else "npm"
    )

    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    time.sleep(3.5)

    # 4. OPEN DASHBOARD IN BROWSER
    print(
        "\n[STEP 4/4] Opening City Traffic "
        "Command Center Dashboard..."
    )

    dashboard_url = "http://localhost:5173"

    print(
        f"\n🚀 SYSTEM ONLINE! "
        f"Access Dashboard at: {dashboard_url}\n"
    )

    webbrowser.open(dashboard_url)

    try:
        backend_proc.wait()
        frontend_proc.wait()

    except KeyboardInterrupt:
        print("\nStopping services...")

        backend_proc.terminate()
        frontend_proc.terminate()


if __name__ == "__main__":
    main()