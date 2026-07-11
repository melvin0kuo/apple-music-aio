# Apple Music AIO Display Widget

A highly polished web widget and local server designed for AIO liquid cooling LCD screens (like the NZXT Kraken Elite) to display what's currently playing on Apple Music (via Windows Store App or iTunes) with dynamic ambient aura backgrounds.

## Features

- **Apple Music Aesthetic**: Gorgeous glassmorphic cover card with typography and shadow effects.
- **Dynamic Ambient Color Aura**: Automatically extracts dominant colors from the album art in real-time to generate a fluid, moving blurred background.
- **60FPS Progress Bar**: Smoothly interpolates song progress locally for continuous fluid animation.
- **Auto-Scrolling Marquee**: Automatically scrolls the song title and artist text if they exceed the screen boundaries.
- **NZXT Kraken Circular Screen Optimized**: Auto-detects circular viewports and shifts UI elements to fit perfectly within circular safe boundaries without crop clipping.
- **Standby Dashboard Clock**: Automatically displays a clean minimalist lock-screen clock when no music is playing, acting as a hardware status dashboard.
- **Zero Configuration**: Uses native Windows Runtime APIs to pull active media data without requiring developer API keys, OAuth logins, or configuration.

## Setup & Running

### 1. Install Dependencies
Make sure you have Python installed, then install the required Windows Runtime bindings:
```bash
pip install winsdk
```

### 2. Run the Server
Start the local server using Python:
```bash
python server.py
```
The server will start hosting the widget on `http://127.0.0.1:48942`.

### 3. Apply to NZXT CAM
1. Open **NZXT CAM**.
2. Navigate to **Lighting** -> **LCD Display**.
3. Select **Web Integration**.
4. Enter the URL:
   ```text
   http://127.0.0.1:48942
   ```
5. Click **Apply**.

---

## Run on Windows Startup (Silently)

To make this server run in the background silently whenever you boot up your PC, simply run:
```bash
python setup_startup.py
```
This script will automatically create a windowless shortcut in your Windows Startup directory that runs `pythonw.exe` in the background (no console windows will pop up).

To disable it, press `Win + R`, type `shell:startup`, and delete the `AppleMusicAIO.lnk` shortcut file.
