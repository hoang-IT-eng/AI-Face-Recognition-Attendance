from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
def root():
    return {
        "message": "Face Attendance API đang chạy",
        "docs": "/docs",
        "modules": ["auth", "users", "attendance", "schedules", "camera", "alerts", "privacy", "reports"],
    }
