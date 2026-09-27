import sys
from pathlib import Path
from urllib.parse import parse_qs

# Add project root directory to sys.path so rakshak package can be imported
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from rakshak.backend.main import app as fastapi_app


async def app(scope, receive, send):
    """
    Vercel ASGI wrapper that extracts destination path from __path query param
    and dynamically sets scope['path'] so FastAPI routes accurately.
    """
    if scope["type"] == "http":
        qs = scope.get("query_string", b"").decode("utf-8")
        parsed = parse_qs(qs)
        if "__path" in parsed and parsed["__path"]:
            actual_path = parsed["__path"][0]
            if not actual_path.startswith("/"):
                actual_path = f"/{actual_path}"
            scope["path"] = actual_path
            scope["raw_path"] = actual_path.encode("utf-8")
    await fastapi_app(scope, receive, send)
