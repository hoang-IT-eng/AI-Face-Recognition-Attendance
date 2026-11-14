from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import User, Attendance, Schedule, AttendanceStatus
from schemas import PayrollSummary, PayrollRow, EmployeeReportOut, EmployeeDayLog

router = APIRouter(prefix="/reports", tags=["Reports"])

DAY_NAMES = {
    0: "Thứ Hai",
    1: "Thứ Ba",
    2: "Thứ Tư",
    3: "Thứ Năm",
    4: "Thứ Sáu",
    5: "Thứ Bảy",
    6: "Chủ Nhật",
}


def _parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def _working_days(date_from: date, date_to: date) -> int:
    n = 0
    cur = date_from
    while cur <= date_to:
        if cur.weekday() < 5:
            n += 1
        cur += timedelta(days=1)
    return max(n, 1)


def _ot_hours(record: Attendance, schedule: Schedule | None) -> float:
    if not record.check_in or not record.check_out or not schedule:
        return 0.0
    try:
        eh, em = map(int, schedule.end_time.split(":"))
        end = record.check_out.replace(hour=eh, minute=em, second=0, microsecond=0)
        if record.check_out.tzinfo and end.tzinfo is None:
            end = end.replace(tzinfo=record.check_out.tzinfo)
        delta = (record.check_out - end).total_seconds() / 3600.0
        return max(0.0, round(delta, 1))
    except Exception:
        return 0.0


def _fmt_time(dt) -> str | None:
    if not dt:
        return None
    return dt.strftime("%H:%M:%S")


def _total_hours(check_in, check_out) -> str:
    if not check_in or not check_out:
        return "--"
    secs = int((check_out - check_in).total_seconds())
    h, rem = divmod(max(0, secs), 3600)
    m = rem // 60
    return f"{h}h{m:02d}m"


@router.get("/payroll", response_model=PayrollSummary)
def payroll_report(
    date_from: str = Query(...),
    date_to: str = Query(...),
    group: str = Query(None),
    db: Session = Depends(get_db),
):
    d0, d1 = _parse_date(date_from), _parse_date(date_to)
    standard = _working_days(d0, d1)
    users_q = db.query(User)
    if group:
        users_q = users_q.filter(User.group == group)
    users = users_q.all()

    schedules = {s.id: s for s in db.query(Schedule).all()}
    default_schedule = next(iter(schedules.values()), None)

    rows: list[PayrollRow] = []
    total_ot = 0.0
    total_present = 0
    compliance_sum = 0.0

    for u in users:
        recs = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == u.id,
                Attendance.date >= date_from,
                Attendance.date <= date_to,
            )
            .all()
        )
        present = sum(
            1 for r in recs if r.status in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.early_leave)
        )
        late = sum(1 for r in recs if r.status == AttendanceStatus.late)
        early = sum(1 for r in recs if r.status == AttendanceStatus.early_leave)
        absent = max(0, standard - present)
        ot = round(sum(_ot_hours(r, schedules.get(r.schedule_id) or default_schedule) for r in recs), 1)
        compliance = round(100.0 * present / standard, 1) if standard else 100.0
        compliance = max(0.0, min(100.0, compliance - late * 0.5))

        rows.append(PayrollRow(
            code=u.code,
            name=u.name,
            role=u.role or "Chuyên viên",
            dept=u.group or "",
            standard_days=standard,
            present_days=present,
            late_count=late,
            early_count=early,
            ot_hours=ot,
            absent_days=absent,
            compliance=compliance,
        ))
        total_ot += ot
        total_present += present
        compliance_sum += compliance

    n = len(rows) or 1
    return PayrollSummary(
        active_users=len(rows),
        total_work_days=total_present,
        total_ot_hours=round(total_ot, 1),
        avg_compliance=round(compliance_sum / n, 1),
        rows=rows,
    )


@router.get("/employees/{code}", response_model=EmployeeReportOut)
def employee_report(
    code: str,
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.code == code).first()
    if not user:
        raise HTTPException(404, f"Không tìm thấy nhân viên {code}")

    if not date_to:
        date_to = date.today().isoformat()
    if not date_from:
        d1 = _parse_date(date_to)
        date_from = date(d1.year, d1.month, 1).isoformat()

    d0, d1 = _parse_date(date_from), _parse_date(date_to)
    standard = _working_days(d0, d1)
    schedules = {s.id: s for s in db.query(Schedule).all()}
    default_schedule = next(iter(schedules.values()), None)

    recs = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user.id,
            Attendance.date >= date_from,
            Attendance.date <= date_to,
        )
        .order_by(Attendance.date.desc())
        .all()
    )

    days: list[EmployeeDayLog] = []
    ot_total = 0.0
    confs = []
    present = 0
    late = 0

    for r in recs:
        sch = schedules.get(r.schedule_id) or default_schedule
        ot = _ot_hours(r, sch)
        ot_total += ot
        if r.status in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.early_leave):
            present += 1
        if r.status == AttendanceStatus.late:
            late += 1
        if r.confidence is not None:
            confs.append(r.confidence)

        try:
            d = _parse_date(r.date)
            day_name = DAY_NAMES.get(d.weekday(), "")
            if d == date.today():
                day_name = f"{day_name} (Hôm nay)"
            date_label = d.strftime("%d/%m/%Y")
        except Exception:
            day_name = ""
            date_label = r.date

        if ot > 0:
            status, status_label = "ot", f"OT +{ot:.1f} giờ"
        elif r.status == AttendanceStatus.late:
            status, status_label = "late", "Đi muộn"
        elif r.status == AttendanceStatus.early_leave:
            status, status_label = "early", "Về sớm"
        elif r.status == AttendanceStatus.absent:
            status, status_label = "absent", "Vắng"
        else:
            status, status_label = "ontime", "Đúng giờ"

        conf_str = f"{r.confidence * 100:.1f}%" if r.confidence is not None and r.confidence <= 1 else (
            f"{r.confidence:.1f}%" if r.confidence is not None else None
        )
        kiosk = r.kiosk_id or "Kiosk"
        days.append(EmployeeDayLog(
            date=date_label,
            day_name=day_name,
            shift=sch.name if sch else "Ca làm việc",
            hours=f"{sch.start_time} - {sch.end_time}" if sch else "",
            check_in=_fmt_time(r.check_in),
            kiosk_in=f"{kiosk} • {conf_str}" if r.check_in and conf_str else (kiosk if r.check_in else None),
            check_out=_fmt_time(r.check_out),
            kiosk_out=f"{kiosk} • {conf_str}" if r.check_out and conf_str else ("Đang làm việc" if r.check_in and not r.check_out else None),
            total_hours=_total_hours(r.check_in, r.check_out),
            status=status,
            status_label=status_label,
            sub_note=r.note,
            conf=conf_str,
        ))

    avg_conf = round(sum(confs) / len(confs) * (100 if confs and confs[0] <= 1 else 1), 1) if confs else 0.0

    return EmployeeReportOut(
        code=user.code,
        name=user.name,
        group=user.group,
        role=user.role,
        standard_days=standard,
        present_days=present,
        late_count=late,
        ot_hours=round(ot_total, 1),
        avg_confidence=avg_conf,
        days=days,
    )
