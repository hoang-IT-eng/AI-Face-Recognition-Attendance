import json
from datetime import datetime, timezone, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import Alert, AlertLevel, Attendance, AttendanceStatus, User, Schedule
from schemas import AlertOut, AlertResolve

router = APIRouter(prefix="/alerts", tags=["Alerts"])

LEVEL_LABELS = {
    AlertLevel.high: "MỨC CAO",
    AlertLevel.medium: "TRUNG BÌNH",
    AlertLevel.low: "MỨC THẤP",
}


def _ago(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    secs = max(0, int((now - dt).total_seconds()))
    if secs < 60:
        return "Vừa xong"
    if secs < 3600:
        return f"{secs // 60} phút trước"
    if secs < 86400:
        return f"{secs // 3600} giờ trước"
    return f"{secs // 86400} ngày trước"


def _to_out(a: Alert) -> AlertOut:
    tags = []
    if a.tags:
        try:
            tags = json.loads(a.tags)
        except Exception:
            tags = [a.tags]
    created = a.created_at or datetime.now(timezone.utc)
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return AlertOut(
        id=a.id,
        level=a.level,
        level_label=LEVEL_LABELS.get(a.level, str(a.level)),
        time=created.astimezone().strftime("%H:%M:%S"),
        ago=_ago(created),
        type=a.type,
        rule=a.rule,
        icon=a.icon or "warning",
        target=a.target,
        sub_target=a.sub_target,
        is_camera=bool(a.is_camera),
        detail=a.detail,
        tags=tags,
        modal_type=a.modal_type,
        resolved=bool(a.resolved),
        created_at=created,
    )


def create_alert(
    db: Session,
    *,
    level: AlertLevel,
    type_: str,
    target: str,
    detail: str = "",
    rule: str = "",
    icon: str = "warning",
    sub_target: str = "",
    is_camera: bool = False,
    tags: list | None = None,
    modal_type: str | None = None,
) -> Alert:
    alert = Alert(
        level=level,
        type=type_,
        rule=rule,
        icon=icon,
        target=target,
        sub_target=sub_target,
        is_camera=is_camera,
        detail=detail,
        tags=json.dumps(tags or [], ensure_ascii=False),
        modal_type=modal_type,
        resolved=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def emit_alert_bg(**kwargs):
    """Tạo alert từ thread camera (session riêng)."""
    db = SessionLocal()
    try:
        create_alert(db, **kwargs)
    finally:
        db.close()


def _scan_attendance_alerts(db: Session):
    """Sinh cảnh báo đi muộn / vắng từ dữ liệu hôm nay (idempotent theo type+target+ngày)."""
    today = date.today().isoformat()
    now = datetime.now()
    schedules = db.query(Schedule).all()
    active = None
    for s in schedules:
        days = [int(d) for d in (s.days_of_week or "1,2,3,4,5").split(",") if d]
        if now.isoweekday() in days:
            active = s
            break

    # Late alerts
    lates = (
        db.query(Attendance)
        .join(User)
        .filter(Attendance.date == today, Attendance.status == AttendanceStatus.late)
        .all()
    )
    for a in lates:
        target = a.user.name if a.user else f"User#{a.user_id}"
        exists = (
            db.query(Alert)
            .filter(
                Alert.type.in_(["Đi muộn", "Đi muộn vượt quy định"]),
                Alert.target == target,
                Alert.created_at >= datetime.combine(date.today(), datetime.min.time()),
            )
            .first()
        )
        if exists:
            continue
        late_mins = 0
        if a.check_in and active:
            try:
                sh, sm = map(int, active.start_time.split(":"))
                start = a.check_in.replace(hour=sh, minute=sm, second=0, microsecond=0)
                if a.check_in.tzinfo and start.tzinfo is None:
                    start = start.replace(tzinfo=a.check_in.tzinfo)
                late_mins = max(0, int((a.check_in - start).total_seconds() // 60) - (active.late_threshold or 0))
            except Exception:
                late_mins = 0
        level = AlertLevel.medium if late_mins >= 5 else AlertLevel.low
        create_alert(
            db,
            level=level,
            type_="Đi muộn vượt quy định" if late_mins >= 5 else "Đi muộn",
            rule="Vi phạm ca làm việc",
            icon="schedule",
            target=target,
            sub_target=f"{a.user.code} · {a.user.group or ''}" if a.user else "",
            detail=f"Check-in lúc {a.check_in.strftime('%H:%M') if a.check_in else '--'}.",
            tags=[f"Ca: {active.name}" if active else "Ca làm việc"],
            is_camera=False,
        )

    # Absent after grace
    if active:
        try:
            sh, sm = map(int, active.start_time.split(":"))
            threshold = datetime.now().replace(hour=sh, minute=sm, second=0, microsecond=0) + timedelta(
                minutes=(active.late_threshold or 15) + 30
            )
        except Exception:
            threshold = None
        if threshold and datetime.now() >= threshold:
            checked_ids = {
                r.user_id
                for r in db.query(Attendance).filter(Attendance.date == today).all()
            }
            for u in db.query(User).all():
                if u.id in checked_ids:
                    continue
                exists = (
                    db.query(Alert)
                    .filter(
                        Alert.type == "Vắng chưa điểm danh",
                        Alert.target == u.name,
                        Alert.created_at >= datetime.combine(date.today(), datetime.min.time()),
                    )
                    .first()
                )
                if exists:
                    continue
                create_alert(
                    db,
                    level=AlertLevel.low,
                    type_="Vắng chưa điểm danh",
                    rule="Tự động phát hiện vắng",
                    icon="person_off",
                    target=u.name,
                    sub_target=f"{u.code} · {u.group or ''}",
                    detail=f"Quá giờ ân hạn ca {active.name} chưa có bản ghi điểm danh.",
                    tags=["Trạng thái: Không phép tạm thời"],
                )


@router.get("/", response_model=list[AlertOut])
def list_alerts(
    level: str = Query(None),
    resolved: bool = Query(None),
    scan: bool = Query(True, description="Quét sinh cảnh báo từ điểm danh hôm nay"),
    db: Session = Depends(get_db),
):
    if scan:
        try:
            _scan_attendance_alerts(db)
        except Exception:
            pass

    q = db.query(Alert)
    if level and level != "all":
        try:
            q = q.filter(Alert.level == AlertLevel(level))
        except ValueError:
            pass
    if resolved is not None:
        q = q.filter(Alert.resolved == resolved)
    rows = q.order_by(Alert.created_at.desc()).limit(100).all()
    return [_to_out(a) for a in rows]


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db)):
    rows = db.query(Alert).filter(Alert.resolved == False).all()  # noqa: E712
    return {
        "unresolved_high": sum(1 for a in rows if a.level == AlertLevel.high),
        "unresolved_medium": sum(1 for a in rows if a.level == AlertLevel.medium),
        "unresolved_low": sum(1 for a in rows if a.level == AlertLevel.low),
        "unresolved_total": len(rows),
    }


@router.patch("/{alert_id}", response_model=AlertOut)
def resolve_alert(alert_id: int, data: AlertResolve, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Không tìm thấy cảnh báo")
    alert.resolved = data.resolved
    db.commit()
    db.refresh(alert)
    return _to_out(alert)


@router.post("/resolve-all")
def resolve_all(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.resolved == False).update({"resolved": True})  # noqa: E712
    db.commit()
    return {"message": "Đã đánh dấu tất cả cảnh báo đã xem"}
