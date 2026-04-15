from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import pandas as pd
import io

from database import get_db
from models import Attendance, User, Schedule, AttendanceStatus
from schemas import AttendanceManual, AttendanceUpdate, AttendanceOut

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def _to_out(a: Attendance) -> AttendanceOut:
    out = AttendanceOut.model_validate(a)
    if a.user:
        out.user_name = a.user.name
        out.user_code = a.user.code
    return out


@router.get("/", response_model=list[AttendanceOut])
def list_attendance(
    date_from: str = Query(None, description="YYYY-MM-DD"),
    date_to: str = Query(None, description="YYYY-MM-DD"),
    user_id: int = Query(None),
    group: str = Query(None),
    status: AttendanceStatus = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).join(User)
    if date_from:
        q = q.filter(Attendance.date >= date_from)
    if date_to:
        q = q.filter(Attendance.date <= date_to)
    if user_id:
        q = q.filter(Attendance.user_id == user_id)
    if group:
        q = q.filter(User.group == group)
    if status:
        q = q.filter(Attendance.status == status)
    return [_to_out(a) for a in q.order_by(Attendance.date.desc()).all()]


@router.get("/today", response_model=list[AttendanceOut])
def today_attendance(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    records = db.query(Attendance).join(User).filter(Attendance.date == today).all()
    return [_to_out(a) for a in records]


@router.post("/manual", response_model=AttendanceOut)
def manual_attendance(data: AttendanceManual, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    existing = db.query(Attendance).filter(
        Attendance.user_id == data.user_id,
        Attendance.date == data.date,
        Attendance.schedule_id == data.schedule_id,
    ).first()

    if existing:
        existing.status = data.status
        existing.note = data.note
        existing.is_manual = 1
        db.commit()
        db.refresh(existing)
        return _to_out(existing)

    record = Attendance(
        user_id=data.user_id,
        date=data.date,
        status=data.status,
        schedule_id=data.schedule_id,
        note=data.note,
        is_manual=1,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.put("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(attendance_id: int, data: AttendanceUpdate, db: Session = Depends(get_db)):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(404, "Không tìm thấy bản ghi")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(404, "Không tìm thấy bản ghi")
    db.delete(record)
    db.commit()
    return {"message": "Đã xóa"}


# ── Thống kê ──────────────────────────────────────────
@router.get("/stats/summary")
def stats_summary(
    date_from: str = Query(...),
    date_to: str = Query(...),
    group: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).join(User).filter(
        Attendance.date >= date_from,
        Attendance.date <= date_to,
    )
    if group:
        q = q.filter(User.group == group)
    records = q.all()

    summary = {
        "total": len(records),
        "present": sum(1 for r in records if r.status == AttendanceStatus.present),
        "absent": sum(1 for r in records if r.status == AttendanceStatus.absent),
        "late": sum(1 for r in records if r.status == AttendanceStatus.late),
        "early_leave": sum(1 for r in records if r.status == AttendanceStatus.early_leave),
    }
    return summary


# ── Export Excel ──────────────────────────────────────
@router.get("/export/excel")
def export_excel(
    date_from: str = Query(...),
    date_to: str = Query(...),
    group: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).join(User).filter(
        Attendance.date >= date_from,
        Attendance.date <= date_to,
    )
    if group:
        q = q.filter(User.group == group)
    records = q.all()

    rows = []
    for r in records:
        rows.append({
            "Ngày": r.date,
            "Mã số": r.user.code if r.user else "",
            "Họ tên": r.user.name if r.user else "",
            "Lớp/Phòng ban": r.user.group if r.user else "",
            "Giờ vào": r.check_in.strftime("%H:%M:%S") if r.check_in else "",
            "Giờ ra": r.check_out.strftime("%H:%M:%S") if r.check_out else "",
            "Trạng thái": r.status.value,
            "Ghi chú": r.note or "",
            "Thủ công": "Có" if r.is_manual else "Không",
        })

    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Điểm danh")
    buf.seek(0)

    filename = f"diemdanh_{date_from}_{date_to}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
