import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import engine, Base, SessionLocal
import models  # noqa: F401 — đảm bảo models được load trước khi tạo bảng
from db_migrate import ensure_schema
from routes import users, attendance, schedules, camera, auth, alerts, privacy, reports
from routes.auth import ensure_default_admin

# Tạo tất cả bảng + migrate cột mới
Base.metadata.create_all(bind=engine)
ensure_schema()

# Seed admin mặc định
_db = SessionLocal()
try:
    ensure_default_admin(_db)
finally:
    _db.close()

app = FastAPI(
    title="Face Attendance API",
    description="Hệ thống điểm danh khuôn mặt",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(schedules.router)
app.include_router(camera.router)
app.include_router(alerts.router)
app.include_router(privacy.router)
app.include_router(reports.router)

# Built React UI (Docker / HF Spaces). Local API-only: folder may be missing.
_STATIC_CANDIDATES = [
    Path(os.getenv("STATIC_DIR", "/app/static")),
    Path(__file__).resolve().parent / "static",
]
_STATIC_DIR = next(
    (p for p in _STATIC_CANDIDATES if p.is_dir() and (p / "index.html").is_file()),
    None,
)
_HAS_STATIC = _STATIC_DIR is not None

_API_ROOTS = {
    "auth",
    "users",
    "attendance",
    "schedules",
    "camera",
    "alerts",
    "privacy",
    "reports",
    "docs",
    "redoc",
    "openapi.json",
    "api",
}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "face-attendance"}


if _HAS_STATIC:
    assets = _STATIC_DIR / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")

    @app.get("/")
    def spa_root():
        return FileResponse(_STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        first = full_path.split("/", 1)[0]
        if first in _API_ROOTS:
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = (_STATIC_DIR / full_path).resolve()
        try:
            candidate.relative_to(_STATIC_DIR.resolve())
        except ValueError:
            raise HTTPException(status_code=404, detail="Not Found")
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_STATIC_DIR / "index.html")
else:

    @app.get("/")
    def root():
        return {
            "message": "Face Attendance API đang chạy",
            "docs": "/docs",
            "modules": [
                "auth",
                "users",
                "attendance",
                "schedules",
                "camera",
                "alerts",
                "privacy",
                "reports",
            ],
        }
