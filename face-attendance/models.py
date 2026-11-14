from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from database import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"       # Có mặt
    absent = "absent"         # Vắng
    late = "late"             # Đi trễ
    early_leave = "early_leave"  # Về sớm


class AlertLevel(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)   # Mã số SV/NV
    group = Column(String(100))                               # Lớp / phòng ban
    role = Column(String(100))                                # Chức danh
    email = Column(String(150))
    phone = Column(String(20))
    pin_hash = Column(String(128), nullable=True)             # PIN 4 số (hash)
    consent_status = Column(String(20), default="pending")    # signed | declined | pending
    consent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    face_embeddings = relationship("FaceEmbedding", back_populates="user", cascade="all, delete")
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete")
    consents = relationship("ConsentLog", back_populates="user", cascade="all, delete")


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    embedding = Column(Text, nullable=False)   # JSON string của numpy array
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="face_embeddings")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)   # Tên ca / lớp học
    code = Column(String(50), nullable=True)
    group = Column(String(100))                   # Lớp / phòng ban áp dụng
    start_time = Column(String(5), nullable=False)  # "08:00"
    end_time = Column(String(5), nullable=False)    # "17:00"
    break_start = Column(String(5), nullable=True)  # "12:00"
    break_end = Column(String(5), nullable=True)    # "13:00"
    late_threshold = Column(Integer, default=15)    # Trễ bao nhiêu phút
    days_of_week = Column(String(20), default="1,2,3,4,5")  # 1=Thứ 2 ... 7=CN

    attendances = relationship("Attendance", back_populates="schedule")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.absent)
    note = Column(String(255))
    is_manual = Column(Integer, default=0)   # 1 = điểm danh thủ công
    confidence = Column(Float, nullable=True)
    kiosk_id = Column(String(50), nullable=True)
    method = Column(String(30), nullable=True)  # face | pin | qr | manual
    date = Column(String(10), nullable=False)  # "2024-01-15"
    edited_by = Column(String(100), nullable=True)
    attachment_note = Column(String(255), nullable=True)

    user = relationship("User", back_populates="attendances")
    schedule = relationship("Schedule", back_populates="attendances")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), default="Quản trị viên")
    role = Column(String(50), default="admin")
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(Enum(AlertLevel), default=AlertLevel.medium)
    type = Column(String(100), nullable=False)
    rule = Column(String(150), nullable=True)
    icon = Column(String(50), default="warning")
    target = Column(String(150), nullable=False)
    sub_target = Column(String(200), nullable=True)
    is_camera = Column(Boolean, default=False)
    detail = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON list
    modal_type = Column(String(20), nullable=True)  # video | snapshot | null
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    version = Column(String(50), default="Consent Form v2.1")
    source = Column(String(150), default="Web Admin HR")
    status = Column(String(20), default="signed")  # signed | declined
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="consents")


class PrivacySettings(Base):
    __tablename__ = "privacy_settings"

    id = Column(Integer, primary_key=True, index=True)
    raw_image_store = Column(Boolean, default=False)
    retention = Column(String(50), default="employed-retention")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
