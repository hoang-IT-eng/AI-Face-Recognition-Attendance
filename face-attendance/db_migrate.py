"""Thêm cột mới vào SQLite nếu DB đã tồn tại (create_all không ALTER)."""
from sqlalchemy import text, inspect
from database import engine


def _existing_columns(table: str) -> set[str]:
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def _add_column(table: str, column_def: str):
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_def}"))


def ensure_schema():
    user_cols = _existing_columns("users")
    for col, ddl in [
        ("role", "role VARCHAR(100)"),
        ("pin_hash", "pin_hash VARCHAR(128)"),
        ("consent_status", "consent_status VARCHAR(20) DEFAULT 'pending'"),
        ("consent_at", "consent_at DATETIME"),
    ]:
        if user_cols and col not in user_cols:
            _add_column("users", ddl)

    att_cols = _existing_columns("attendances")
    for col, ddl in [
        ("confidence", "confidence FLOAT"),
        ("kiosk_id", "kiosk_id VARCHAR(50)"),
        ("method", "method VARCHAR(30)"),
        ("edited_by", "edited_by VARCHAR(100)"),
        ("attachment_note", "attachment_note VARCHAR(255)"),
    ]:
        if att_cols and col not in att_cols:
            _add_column("attendances", ddl)

    sch_cols = _existing_columns("schedules")
    for col, ddl in [
        ("code", "code VARCHAR(50)"),
        ("break_start", "break_start VARCHAR(5)"),
        ("break_end", "break_end VARCHAR(5)"),
    ]:
        if sch_cols and col not in sch_cols:
            _add_column("schedules", ddl)
