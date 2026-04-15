from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from database import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"       # Có mặt
    absent = "absent"         # Vắng
    late = "late"             # Đi trễ
    early_leave = "early_leave"  # Về sớm


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)   # Mã số SV/NV
    group = Column(String(100))                               # Lớp / phòng ban
    email = Column(String(150))
    phone = Column(String(20))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    face_embeddings = relationship("FaceEmbedding", back_populates="user", cascade="all, delete")
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete")


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
    group = Column(String(100))                   # Lớp / phòng ban áp dụng
    start_time = Column(String(5), nullable=False)  # "08:00"
    end_time = Column(String(5), nullable=False)    # "17:00"
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
    date = Column(String(10), nullable=False)  # "2024-01-15"

    user = relationship("User", back_populates="attendances")
    schedule = relationship("Schedule", back_populates="attendances")
