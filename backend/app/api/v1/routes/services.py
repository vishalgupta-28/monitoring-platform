from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_role
from app.db.models import AlertRule, Service, User
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter()


@router.post('', response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role('operator', 'admin')),
) -> Service:
    existing = await db.scalar(
        select(Service).where(or_(Service.slug == payload.slug, Service.base_url == payload.base_url))
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Service already exists for this slug or URL')

    service = Service(**payload.model_dump(), created_by=user.id)
    db.add(service)
    await db.flush()

    db.add_all(
        [
            AlertRule(
                service_id=service.id,
                name=f'{service.name} latency above 500ms',
                metric_name='latency_ms',
                comparison='gt',
                threshold=500,
                severity='warning',
                channels=['email', 'webhook'],
            ),
            AlertRule(
                service_id=service.id,
                name=f'{service.name} error rate above 5%',
                metric_name='error_rate',
                comparison='gt',
                threshold=5,
                severity='critical',
                channels=['email', 'slack', 'webhook'],
            ),
        ]
    )

    await db.commit()
    await db.refresh(service)
    return service


@router.get('', response_model=list[ServiceRead])
async def list_services(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)) -> list[Service]:
    result = await db.scalars(select(Service).order_by(Service.created_at.desc()))
    return list(result)


@router.get('/{service_id}', response_model=ServiceRead)
async def get_service(service_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)) -> Service:
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')
    return service


@router.patch('/{service_id}', response_model=ServiceRead)
async def update_service(
    service_id: str,
    payload: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> Service:
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, key, value)
    await db.commit()
    await db.refresh(service)
    return service


@router.delete('/{service_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> None:
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')
    await db.delete(service)
    await db.commit()
