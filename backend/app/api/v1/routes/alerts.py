from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_role
from app.db.models import AlertEvent, AlertRule, User
from app.schemas.alert import AlertEventRead, AlertRuleCreate, AlertRuleRead, AlertRuleUpdate

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


@router.patch('/{rule_id}', response_model=AlertRuleRead)
async def update_rule(
    rule_id: str,
    payload: AlertRuleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> AlertRule:
    rule = await db.get(AlertRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Alert rule not found')

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete('/{rule_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> None:
    rule = await db.get(AlertRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Alert rule not found')
    await db.execute(delete(AlertEvent).where(AlertEvent.rule_id == rule.id))
    await db.delete(rule)
    await db.commit()


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
