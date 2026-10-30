"""Serve the Expo SPA for browser tests, including direct catalog deep links."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class ExpoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="dist", **kwargs)

    def translate_path(self, path):
        resolved = super().translate_path(path)
        if not Path(resolved).is_file() and "text/html" in self.headers.get("Accept", ""):
            return str(Path("dist/index.html").resolve())
        return resolved


ThreadingHTTPServer(("127.0.0.1", 8083), ExpoHandler).serve_forever()
