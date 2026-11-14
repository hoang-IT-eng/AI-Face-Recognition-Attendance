from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import pandas as pd
import io

from database import get_db
from models import Attendance, User, Schedule, AttendanceStatus
from schemas import (
    AttendanceManual,
    AttendanceUpdate,
    AttendanceOut,
    BackupAttendanceRequest,
    BackupAttendanceOut,
    AdjustmentOut,
)
from security import verify_pin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def _to_out(a: Attendance) -> AttendanceOut:
    out = AttendanceOut.model_validate(a)
    if a.user:
        out.user_name = a.user.name
        out.user_code = a.user.code
        out.user_group = a.user.group or ""
    return out


def _parse_time_on_date(day: str, time_str: str | None) -> datetime | None:
    if not time_str:
        return None
    time_str = time_str.strip()
    # ISO datetime
    if "T" in time_str or len(time_str) > 10 and "-" in time_str[:10]:
        try:
            return datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        except ValueError:
            pass
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(time_str, fmt).time()
            d = datetime.strptime(day, "%Y-%m-%d").date()
            return datetime(d.year, d.month, d.day, t.hour, t.minute, t.second, tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _status_from_times(
    check_in: datetime | None,
    check_out: datetime | None,
    schedule: Schedule | None,
    fallback: AttendanceStatus,
) -> AttendanceStatus:
    if not check_in or not schedule:
        return fallback
    try:
        sh, sm = map(int, schedule.start_time.split(":"))
        threshold = schedule.late_threshold or 15
        local_in = check_in.astimezone() if check_in.tzinfo else check_in
        start = local_in.replace(hour=sh, minute=sm, second=0, microsecond=0)
        late_limit = start.timestamp() + threshold * 60
        if local_in.timestamp() > late_limit:
            return AttendanceStatus.late
        if check_out:
            eh, em = map(int, schedule.end_time.split(":"))
            end = local_in.replace(hour=eh, minute=em, second=0, microsecond=0)
            local_out = check_out.astimezone() if check_out.tzinfo else check_out
            if local_out.timestamp() + 60 < end.timestamp():
                return AttendanceStatus.early_leave
        return AttendanceStatus.present
    except Exception:
        return fallback


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


@router.get("/adjustments", response_model=list[AdjustmentOut])
def list_adjustments(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Attendance)
        .join(User)
        .order_by(Attendance.id.desc())
        .limit(limit)
        .all()
    )
    result = []
    for r in records:
        is_manual = bool(r.is_manual)
        in_new = r.check_in.strftime("%H:%M:%S") if r.check_in else None
        out_new = r.check_out.strftime("%H:%M:%S") if r.check_out else None
        try:
            dlabel = datetime.strptime(r.date, "%Y-%m-%d").strftime("%d/%m/%Y")
        except Exception:
            dlabel = r.date
        ts = ""
        if r.check_in:
            ts = r.check_in.strftime("%H:%M:%S • %d/%m")
        elif r.check_out:
            ts = r.check_out.strftime("%H:%M:%S • %d/%m")
        result.append(AdjustmentOut(
            id=r.id,
            code=r.user.code if r.user else "",
            name=r.user.name if r.user else "",
            dept=r.user.group if r.user else "",
            date=dlabel,
            in_old="--:--" if is_manual else None,
            in_new=in_new,
            out_old="--:--" if is_manual else None,
            out_new=out_new,
            reason=r.note,
            attachment=r.attachment_note or (f"Kiosk {r.kiosk_id}" if r.kiosk_id else None),
            source=f"Thủ công ({r.edited_by})" if is_manual else "Camera AI",
            timestamp=ts or "Đồng bộ",
            is_manual=is_manual,
        ))
    return result


@router.post("/manual", response_model=AttendanceOut)
def manual_attendance(data: AttendanceManual, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    schedule = None
    if data.schedule_id:
        schedule = db.query(Schedule).filter(Schedule.id == data.schedule_id).first()
    else:
        schedule = db.query(Schedule).first()

    check_in = _parse_time_on_date(data.date, data.check_in)
    check_out = _parse_time_on_date(data.date, data.check_out)
    status = _status_from_times(check_in, check_out, schedule, data.status)

    existing = db.query(Attendance).filter(
        Attendance.user_id == data.user_id,
        Attendance.date == data.date,
        Attendance.schedule_id == data.schedule_id,
    ).first()

    if existing:
        existing.status = status
        existing.note = data.note
        existing.is_manual = 1
        existing.method = data.method or "manual"
        existing.edited_by = data.edited_by
        existing.attachment_note = data.attachment_note
        if check_in:
            existing.check_in = check_in
        if check_out:
            existing.check_out = check_out
        db.commit()
        db.refresh(existing)
        return _to_out(existing)

    record = Attendance(
        user_id=data.user_id,
        date=data.date,
        status=status,
        schedule_id=data.schedule_id or (schedule.id if schedule else None),
        note=data.note,
        is_manual=1,
        check_in=check_in,
        check_out=check_out,
        method=data.method or "manual",
        edited_by=data.edited_by,
        attachment_note=data.attachment_note,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.post("/backup", response_model=BackupAttendanceOut)
def backup_attendance(data: BackupAttendanceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.code == data.code.strip()).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy mã nhân viên")

    method = (data.method or "pin").lower()
    if method == "pin":
        if not data.pin or len(data.pin) < 4:
            raise HTTPException(400, "Vui lòng nhập đủ 4 chữ số mã PIN")
        if not verify_pin(data.pin, user.pin_hash):
            raise HTTPException(401, "Mã PIN không đúng")
        method_label = "Mã PIN xác thực nội bộ"
        note = "Điểm danh thay thế bằng mã PIN"
    else:
        # QR/TOTP đơn giản: chấp nhận OTP 6 số hoặc PIN 4 số làm fallback demo
        token = data.otp or data.pin or ""
        if len(token) < 4:
            raise HTTPException(400, "Mã QR/OTP không hợp lệ")
        if user.pin_hash and not verify_pin(token[:4], user.pin_hash) and len(token) < 6:
            raise HTTPException(401, "Mã QR/OTP không đúng")
        method_label = "Mã QR động Time-based OTP"
        note = "Điểm danh thay thế bằng mã QR động"

    today = date.today().isoformat()
    now = datetime.now(timezone.utc)
    schedule = db.query(Schedule).first()
    status = _status_from_times(now, None, schedule, AttendanceStatus.present)

    existing = db.query(Attendance).filter(
        Attendance.user_id == user.id,
        Attendance.date == today,
        Attendance.schedule_id == (schedule.id if schedule else None),
    ).first()

    if existing:
        if not existing.check_in:
            existing.check_in = now
            existing.status = status
        elif not existing.check_out:
            existing.check_out = now
            existing.status = _status_from_times(existing.check_in, now, schedule, existing.status)
        existing.is_manual = 1
        existing.method = method
        existing.note = note
        existing.edited_by = "Backup Channel"
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = Attendance(
            user_id=user.id,
            date=today,
            status=status,
            schedule_id=schedule.id if schedule else None,
            check_in=now,
            is_manual=1,
            method=method,
            note=note,
            edited_by="Backup Channel",
            kiosk_id="Backup",
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    local_now = datetime.now().strftime("%H:%M:%S")
    return BackupAttendanceOut(
        attendance=_to_out(record),
        name=user.name,
        code=user.code,
        dept=user.group or "",
        time=local_now,
        method=method_label,
    )


@router.get("/backup/recent")
def backup_recent(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    records = (
        db.query(Attendance)
        .join(User)
        .filter(Attendance.method.in_(["pin", "qr"]))
        .order_by(Attendance.id.desc())
        .limit(limit)
        .all()
    )
    result = []
    for r in records:
        name = r.user.name if r.user else ""
        code = r.user.code if r.user else ""
        parts = [p for p in name.split() if p]
        initials = (parts[-2][0] + parts[-1][0]).upper() if len(parts) >= 2 else (name[:2].upper() or "NV")
        t = (r.check_in or r.check_out or datetime.now(timezone.utc)).strftime("%H:%M:%S")
        method_label = "Nhập mã PIN" if r.method == "pin" else "Quét mã QR"
        result.append({
            "id": r.id,
            "initials": initials,
            "name": f"{name} ({code})",
            "meta": f"{t} • {method_label}",
        })
    return result


@router.put("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(attendance_id: int, data: AttendanceUpdate, db: Session = Depends(get_db)):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(404, "Không tìm thấy bản ghi")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(record, k, v)
    record.is_manual = 1
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
            "Độ tin cậy": r.confidence if r.confidence is not None else "",
            "Phương thức": r.method or "",
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
