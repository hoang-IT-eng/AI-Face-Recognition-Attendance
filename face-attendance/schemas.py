from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models import AttendanceStatus, AlertLevel


# ── Auth ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    email: str
    role: str


# ── User ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    code: str
    group: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    pin: Optional[str] = None  # 4 digits plaintext → hashed


class UserUpdate(BaseModel):
    name: Optional[str] = None
    group: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    pin: Optional[str] = None
    consent_status: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    code: str
    group: Optional[str]
    role: Optional[str] = None
    email: Optional[str]
    phone: Optional[str]
    consent_status: Optional[str] = "pending"
    consent_at: Optional[datetime] = None
    has_pin: bool = False
    created_at: datetime
    face_count: int = 0

    model_config = {"from_attributes": True}


# ── Schedule ──────────────────────────────────────────
class ScheduleCreate(BaseModel):
    name: str
    code: Optional[str] = None
    group: Optional[str] = None
    start_time: str   # "08:00"
    end_time: str     # "17:00"
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    late_threshold: int = 15
    days_of_week: str = "1,2,3,4,5"


class ScheduleOut(ScheduleCreate):
    id: int
    staff_count: int = 0
    model_config = {"from_attributes": True}


# ── Attendance ────────────────────────────────────────
class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    user_code: str = ""
    user_group: str = ""
    schedule_id: Optional[int]
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    status: AttendanceStatus
    note: Optional[str]
    is_manual: int
    confidence: Optional[float] = None
    kiosk_id: Optional[str] = None
    method: Optional[str] = None
    edited_by: Optional[str] = None
    attachment_note: Optional[str] = None
    date: str

    model_config = {"from_attributes": True}


class AttendanceManual(BaseModel):
    user_id: int
    date: str                          # "2024-01-15"
    status: AttendanceStatus
    schedule_id: Optional[int] = None
    note: Optional[str] = None
    check_in: Optional[str] = None     # "08:00:00" or ISO
    check_out: Optional[str] = None
    edited_by: Optional[str] = "HR Admin"
    attachment_note: Optional[str] = None
    method: Optional[str] = "manual"


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    note: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    edited_by: Optional[str] = None
    attachment_note: Optional[str] = None


class BackupAttendanceRequest(BaseModel):
    code: str
    pin: Optional[str] = None
    otp: Optional[str] = None
    method: str = "pin"  # pin | qr


class BackupAttendanceOut(BaseModel):
    attendance: AttendanceOut
    name: str
    code: str
    dept: str
    time: str
    method: str


class AdjustmentOut(BaseModel):
    id: int
    code: str
    name: str
    dept: str
    date: str
    in_old: Optional[str] = None
    in_new: Optional[str] = None
    out_old: Optional[str] = None
    out_new: Optional[str] = None
    reason: Optional[str] = None
    attachment: Optional[str] = None
    source: str
    timestamp: str
    is_manual: bool


# ── Alerts ────────────────────────────────────────────
class AlertOut(BaseModel):
    id: int
    level: AlertLevel
    level_label: str = ""
    time: str = ""
    ago: str = ""
    type: str
    rule: Optional[str] = None
    icon: str = "warning"
    target: str
    sub_target: Optional[str] = None
    is_camera: bool = False
    detail: Optional[str] = None
    tags: list[str] = []
    modal_type: Optional[str] = None
    resolved: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertResolve(BaseModel):
    resolved: bool = True


# ── Privacy ───────────────────────────────────────────
class PrivacySettingsOut(BaseModel):
    raw_image_store: bool
    retention: str
    encryption: str = "AES-256 GCM"
    consent_rate: float = 0.0
    consent_signed: int = 0
    consent_total: int = 0
    updated_at: Optional[datetime] = None


class PrivacySettingsUpdate(BaseModel):
    raw_image_store: Optional[bool] = None
    retention: Optional[str] = None


class ConsentOut(BaseModel):
    id: int
    code: str
    name: str
    initials: str = ""
    version: str
    timestamp: str
    source: str
    status: str


# ── Reports ───────────────────────────────────────────
class PayrollRow(BaseModel):
    code: str
    name: str
    role: str
    dept: str
    standard_days: int
    present_days: int
    late_count: int
    early_count: int
    ot_hours: float
    absent_days: int
    compliance: float


class PayrollSummary(BaseModel):
    active_users: int
    total_work_days: int
    total_ot_hours: float
    avg_compliance: float
    rows: list[PayrollRow]


class EmployeeDayLog(BaseModel):
    date: str
    day_name: str
    shift: str
    hours: str
    check_in: Optional[str]
    kiosk_in: Optional[str]
    check_out: Optional[str]
    kiosk_out: Optional[str]
    total_hours: str
    status: str
    status_label: str
    sub_note: Optional[str] = None
    conf: Optional[str] = None


class EmployeeReportOut(BaseModel):
    code: str
    name: str
    group: Optional[str]
    role: Optional[str]
    standard_days: int
    present_days: int
    late_count: int
    ot_hours: float
    avg_confidence: float
    days: list[EmployeeDayLog]


# ── Face recognition result ───────────────────────────
class RecognizeResult(BaseModel):
    user_id: Optional[int]
    name: str
    code: str
    score: float
    action: str   # "check_in" | "check_out" | "already_checked" | "unknown" | "spoof_detected"
    group: Optional[str] = None
