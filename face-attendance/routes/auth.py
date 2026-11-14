from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import AdminUser
from schemas import LoginRequest, LoginResponse
from security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

DEFAULT_ADMIN_EMAIL = "admin@secureface.vn"
DEFAULT_ADMIN_PASSWORD = "SecureFace@2026"
LOCKOUT_MINUTES = 15
MAX_ATTEMPTS = 3


def ensure_default_admin(db: Session):
    admin = db.query(AdminUser).filter(AdminUser.email == DEFAULT_ADMIN_EMAIL).first()
    if not admin:
        db.add(AdminUser(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
            name="Quản trị viên SecureFace",
            role="admin",
        ))
        db.commit()


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    ensure_default_admin(db)
    admin = db.query(AdminUser).filter(AdminUser.email == data.email.strip().lower()).first()
    if not admin:
        # thử match không lower
        admin = db.query(AdminUser).filter(AdminUser.email == data.email.strip()).first()

    if not admin:
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")

    now = datetime.now(timezone.utc)
    if admin.locked_until:
        locked = admin.locked_until
        if locked.tzinfo is None:
            locked = locked.replace(tzinfo=timezone.utc)
        if locked > now:
            mins = int((locked - now).total_seconds() // 60) + 1
            raise HTTPException(423, f"Tài khoản tạm khóa. Thử lại sau {mins} phút.")

    if not verify_password(data.password, admin.password_hash):
        admin.failed_attempts = (admin.failed_attempts or 0) + 1
        left = MAX_ATTEMPTS - admin.failed_attempts
        if admin.failed_attempts >= MAX_ATTEMPTS:
            admin.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            admin.failed_attempts = 0
            db.commit()
            raise HTTPException(423, f"Sai mật khẩu quá nhiều lần. Tài khoản bị khóa {LOCKOUT_MINUTES} phút.")
        db.commit()
        raise HTTPException(401, f"Mật khẩu không chính xác. Còn {max(left, 0)} lần thử.")

    admin.failed_attempts = 0
    admin.locked_until = None
    db.commit()

    token = create_access_token({"sub": admin.email, "role": admin.role, "name": admin.name})
    return LoginResponse(
        access_token=token,
        name=admin.name,
        email=admin.email,
        role=admin.role,
    )


@router.get("/me")
def me(db: Session = Depends(get_db)):
    ensure_default_admin(db)
    admin = db.query(AdminUser).filter(AdminUser.email == DEFAULT_ADMIN_EMAIL).first()
    return {
        "email": admin.email if admin else DEFAULT_ADMIN_EMAIL,
        "name": admin.name if admin else "Admin",
        "role": admin.role if admin else "admin",
    }
