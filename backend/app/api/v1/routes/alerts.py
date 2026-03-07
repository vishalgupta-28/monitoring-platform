from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_role
from app.db.models import AlertEvent, AlertRule, User
from app.schemas.alert import AlertEventRead, AlertRuleCreate, AlertRuleRead

router = APIRouter()


@router.post('', response_model=AlertRuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> AlertRule:
    rule = AlertRule(**payload.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get('', response_model=list[AlertRuleRead])
async def list_rules(
    service_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AlertRule]:
    stmt = select(AlertRule).order_by(AlertRule.created_at.desc())
    if service_id:
        stmt = stmt.where(AlertRule.service_id == service_id)
    result = await db.scalars(stmt)
    return list(result)


@router.get('/events', response_model=list[AlertEventRead])
async def list_events(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)) -> list[AlertEvent]:
    result = await db.scalars(select(AlertEvent).order_by(AlertEvent.triggered_at.desc()).limit(200))
    return list(result)


@router.post('/{rule_id}/resolve', response_model=AlertEventRead)
async def resolve_event(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> AlertEvent:
    event = await db.scalar(
        select(AlertEvent).where(AlertEvent.rule_id == rule_id, AlertEvent.status == 'open').order_by(AlertEvent.triggered_at.desc())
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Open alert event not found')
    event.status = 'resolved'
    await db.commit()
    await db.refresh(event)
    return event
