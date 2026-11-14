from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import PrivacySettings, ConsentLog, User
from schemas import PrivacySettingsOut, PrivacySettingsUpdate, ConsentOut

router = APIRouter(prefix="/privacy", tags=["Privacy"])


def _get_or_create_settings(db: Session) -> PrivacySettings:
    s = db.query(PrivacySettings).first()
    if not s:
        s = PrivacySettings(raw_image_store=False, retention="employed-retention")
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


def _initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    if not parts:
        return "NV"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[-2][0] + parts[-1][0]).upper()


@router.get("/settings", response_model=PrivacySettingsOut)
def get_settings(db: Session = Depends(get_db)):
    s = _get_or_create_settings(db)
    users = db.query(User).all()
    signed = sum(1 for u in users if (u.consent_status or "") == "signed")
    total = len(users) or 1
    return PrivacySettingsOut(
        raw_image_store=bool(s.raw_image_store),
        retention=s.retention,
        consent_rate=round(100.0 * signed / total, 1),
        consent_signed=signed,
        consent_total=len(users),
        updated_at=s.updated_at,
    )


@router.put("/settings", response_model=PrivacySettingsOut)
def update_settings(data: PrivacySettingsUpdate, db: Session = Depends(get_db)):
    s = _get_or_create_settings(db)
    if data.raw_image_store is not None:
        s.raw_image_store = data.raw_image_store
    if data.retention is not None:
        s.retention = data.retention
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_settings(db)


@router.get("/consents", response_model=list[ConsentOut])
def list_consents(db: Session = Depends(get_db)):
    rows = db.query(ConsentLog).order_by(ConsentLog.created_at.desc()).limit(100).all()
    result = []
    for r in rows:
        ts = r.created_at or datetime.now(timezone.utc)
        result.append(ConsentOut(
            id=r.id,
            code=r.code,
            name=r.name,
            initials=_initials(r.name),
            version=r.version,
            timestamp=ts.strftime("%d/%m/%Y %H:%M:%S"),
            source=r.source,
            status=r.status,
        ))
    return result


@router.post("/consents", response_model=ConsentOut)
def create_consent(
    code: str,
    status: str = "signed",
    version: str = "Consent Form v2.1",
    source: str = "Web Admin HR",
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.code == code).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    log = ConsentLog(
        user_id=user.id,
        code=user.code,
        name=user.name,
        version=version,
        source=source,
        status=status,
    )
    user.consent_status = status
    user.consent_at = datetime.now(timezone.utc)
    db.add(log)
    db.commit()
    db.refresh(log)
    ts = log.created_at or datetime.now(timezone.utc)
    return ConsentOut(
        id=log.id,
        code=log.code,
        name=log.name,
        initials=_initials(log.name),
        version=log.version,
        timestamp=ts.strftime("%d/%m/%Y %H:%M:%S"),
        source=log.source,
        status=log.status,
    )
