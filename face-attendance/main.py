from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401 — đảm bảo models được load trước khi tạo bảng
from routes import users, attendance, schedules, camera

# Tạo tất cả bảng
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Face Attendance API",
    description="Hệ thống điểm danh khuôn mặt",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(schedules.router)
app.include_router(camera.router)


@app.get("/")
def root():
    return {"message": "Face Attendance API đang chạy", "docs": "/docs"}
