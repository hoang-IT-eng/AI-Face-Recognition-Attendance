from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models import AttendanceStatus


# ── User ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    code: str
    group: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    group: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    code: str
    group: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    face_count: int = 0

    model_config = {"from_attributes": True}


# ── Schedule ──────────────────────────────────────────
class ScheduleCreate(BaseModel):
    name: str
    group: Optional[str] = None
    start_time: str   # "08:00"
    end_time: str     # "17:00"
    late_threshold: int = 15
    days_of_week: str = "1,2,3,4,5"


class ScheduleOut(ScheduleCreate):
    id: int
    model_config = {"from_attributes": True}


# ── Attendance ────────────────────────────────────────
class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    user_code: str = ""
    schedule_id: Optional[int]
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    status: AttendanceStatus
    note: Optional[str]
    is_manual: int
    date: str

    model_config = {"from_attributes": True}


class AttendanceManual(BaseModel):
    user_id: int
    date: str                          # "2024-01-15"
    status: AttendanceStatus
    schedule_id: Optional[int] = None
    note: Optional[str] = None


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    note: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None


# ── Face recognition result ───────────────────────────
class RecognizeResult(BaseModel):
    user_id: Optional[int]
    name: str
    code: str
    score: float
    action: str   # "check_in" | "check_out" | "already_checked" | "unknown" | "spoof_detected"
