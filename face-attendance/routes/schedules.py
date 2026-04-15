from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Schedule
from schemas import ScheduleCreate, ScheduleOut

router = APIRouter(prefix="/schedules", tags=["Schedules"])


@router.get("/", response_model=list[ScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return db.query(Schedule).all()


@router.post("/", response_model=ScheduleOut)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = Schedule(**data.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, data: ScheduleCreate, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(404, "Không tìm thấy ca")
    for k, v in data.model_dump().items():
        setattr(schedule, k, v)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(404, "Không tìm thấy ca")
    db.delete(schedule)
    db.commit()
    return {"message": "Đã xóa ca"}
