"""
Middleware de capture d'erreurs + endpoints /dev/recent-errors et /dev/request-log.

Extrait du backend Diaphane (FastAPI). À porter sur la stack cible :
- Si FastAPI : copier tel quel, ajuster les imports
- Si Express : transposer le concept (ring buffer + middleware)
- Si Django : équivalent middleware Django + vues admin

Le but : exposer un buffer en mémoire des dernières erreurs HTTP capturées,
consommé par `scripts/audit-logs.sh` après chaque run E2E pour détecter
les vrais bugs côté serveur (que l'UI camouffle souvent).
"""

from collections import deque
from datetime import datetime, timezone
import traceback

from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# ── Ring buffers (limite mémoire) ────────────────────────────────────
MAX_ERROR_LOG = 500
_recent_errors: deque = deque(maxlen=MAX_ERROR_LOG)
_request_log: deque = deque(maxlen=2000)


# ── Auth token admin ─────────────────────────────────────────────────
import os
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "change-me")


def verify_admin_token(request: Request):
    """À utiliser comme Depends() sur les endpoints /dev/*."""
    token = request.headers.get("X-Admin-Token")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")


# ── Middleware ───────────────────────────────────────────────────────
class ErrorCaptureMiddleware(BaseHTTPMiddleware):
    """Capture chaque requête dans _request_log ; les 4xx/5xx dans _recent_errors."""

    async def dispatch(self, request: Request, call_next):
        import time
        start = time.time()
        response: Response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)

        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "method": request.method,
            "path": str(request.url.path),
            "query": str(request.url.query) if request.url.query else None,
            "status": response.status_code,
            "duration_ms": duration_ms,
        }
        _request_log.append(entry)
        if response.status_code >= 400:
            _recent_errors.append(entry)
        return response


# ── Handler d'exception global (capture les 500 avec traceback) ──────
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    tb_str = "".join(tb)
    _recent_errors.append({
        "ts": datetime.now(timezone.utc).isoformat(),
        "method": request.method,
        "path": str(request.url.path),
        "status": 500,
        "error": str(exc),
        "traceback": tb_str,
    })
    # En prod, ne JAMAIS exposer le traceback côté client
    body = {"detail": "Internal Server Error"}
    if os.getenv("ENVIRONMENT") == "development":
        body["traceback"] = tb_str
    return JSONResponse(status_code=500, content=body)


# ── Endpoints d'audit ────────────────────────────────────────────────
def register_audit_endpoints(app: FastAPI):
    """À appeler après création de l'app FastAPI."""

    app.add_middleware(ErrorCaptureMiddleware)
    app.add_exception_handler(Exception, global_exception_handler)

    @app.get("/dev/recent-errors", tags=["dev"], dependencies=[Depends(verify_admin_token)])
    def get_recent_errors(clear: bool = False):
        """Retourne les erreurs récentes capturées en mémoire.
        ?clear=true pour vider le buffer après lecture."""
        errors = list(_recent_errors)
        if clear:
            _recent_errors.clear()
        by_status: dict = {}
        for e in errors:
            s = e.get("status", "unknown")
            by_status.setdefault(s, []).append(e)
        return {
            "total_errors": len(errors),
            "by_status": {k: len(v) for k, v in by_status.items()},
            "errors": errors,
        }

    @app.get("/dev/request-log", tags=["dev"], dependencies=[Depends(verify_admin_token)])
    def get_request_log(last: int = 100, errors_only: bool = False):
        """Retourne les N dernières requêtes (pour audit)."""
        entries = list(_request_log)
        if errors_only:
            entries = [e for e in entries if e["status"] >= 400]
        return {"total": len(entries), "entries": entries[-last:]}


# ── Usage dans main.py ───────────────────────────────────────────────
#
# from fastapi import FastAPI
# from .error_capture_middleware import register_audit_endpoints
#
# app = FastAPI()
# register_audit_endpoints(app)
#
# (puis register routers, etc.)
