import asyncio
import base64
import json
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Global media state
media_state = {
    "title": "",
    "artist": "",
    "album": "",
    "status": "stopped",
    "duration": 0,
    "position": 0,
    "album_art": "",
    "app": "",
    "updated_at": 0
}
state_lock = threading.Lock()

# Flag to check if winsdk is installed
HAS_WINSDK = False
try:
    from winsdk.windows.media.control import GlobalSystemMediaTransportControlsSessionManager as MediaManager
    from winsdk.windows.media.control import GlobalSystemMediaTransportControlsSessionPlaybackStatus as PlaybackStatus
    from winsdk.windows.storage.streams import DataReader
    HAS_WINSDK = True
except ImportError:
    print("Warning: winsdk is not installed. Please install it using: pip install winsdk", file=sys.stderr)

async def get_media_info():
    if not HAS_WINSDK:
        return None
    try:
        sessions = await MediaManager.request_async()
        current_session = sessions.get_current_session()
        if not current_session:
            return None
        
        # Get metadata, timeline, and playback info
        props = await current_session.try_get_media_properties_async()
        timeline = current_session.get_timeline_properties()
        playback = current_session.get_playback_info()
        
        app_id = current_session.source_app_user_model_id
        
        # Extract playback status
        status_str = "stopped"
        if playback:
            status = playback.playback_status
            if status == PlaybackStatus.PLAYING:
                status_str = "playing"
            elif status == PlaybackStatus.PAUSED:
                status_str = "paused"
            elif status == PlaybackStatus.STOPPED:
                status_str = "stopped"

        # Extract timeline (position and duration)
        duration = 0
        position = 0
        if timeline:
            duration = timeline.end_time.total_seconds()
            position = timeline.position.total_seconds()

        # Extract album art (thumbnail)
        album_art_base64 = ""
        if props and props.thumbnail:
            try:
                stream = await props.thumbnail.open_read_async()
                if stream:
                    size = stream.size
                    if size > 0:
                        reader = DataReader(stream.get_input_stream_at(0))
                        await reader.load_async(size)
                        
                        image_bytes = bytearray(size)
                        reader.read_bytes(image_bytes)
                        
                        if image_bytes:
                            # Detect mime type or default to jpeg
                            mime = "image/jpeg"
                            # Basic PNG header check
                            if len(image_bytes) > 4 and image_bytes[:4] == b'\x89PNG':
                                mime = "image/png"
                            
                            album_art_base64 = f"data:{mime};base64," + base64.b64encode(image_bytes).decode('utf-8')
            except Exception as e:
                # Silent catch for thumbnail read errors
                pass

        return {
            "title": props.title if props else "",
            "artist": props.artist if props else "",
            "album": props.album_title if props else "",
            "status": status_str,
            "duration": duration,
            "position": position,
            "album_art": album_art_base64,
            "app": app_id,
            "updated_at": time.time()
        }
    except Exception as e:
        # Avoid flood of logs if it fails temporarily
        return None

def background_loop():
    """Asynchronous background loop to poll media controls."""
    if not HAS_WINSDK:
        return
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    async def poll():
        global media_state
        while True:
            state = await get_media_info()
            with state_lock:
                if state:
                    # If we don't have album art in current poll, but the song is the same, preserve the old art
                    if not state["album_art"] and media_state["title"] == state["title"] and media_state["artist"] == state["artist"]:
                        state["album_art"] = media_state["album_art"]
                    media_state = state
                else:
                    media_state = {
                        "title": "",
                        "artist": "",
                        "album": "",
                        "status": "stopped",
                        "duration": 0,
                        "position": 0,
                        "album_art": "",
                        "app": "",
                        "updated_at": time.time()
                    }
            await asyncio.sleep(0.5)

    loop.run_until_complete(poll())

class MediaWidgetHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from the directory where server.py is located
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        # Disable caching for API and static files for live development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            with state_lock:
                # Include a server-side timestamp to calculate drift
                response_data = dict(media_state)
                response_data["server_time"] = time.time()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            super().do_GET()

def main():
    port = 48942
    print(f"Starting Apple Music AIO Server on http://127.0.0.1:{port}")
    
    # Start the SMTC polling thread
    t = threading.Thread(target=background_loop, daemon=True)
    t.start()
    
    # Start the HTTP server
    server = ThreadingHTTPServer(('127.0.0.1', port), MediaWidgetHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()

if __name__ == "__main__":
    main()
