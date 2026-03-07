from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_api_key_or_user
from app.db.models import User
from app.schemas.log import LogEntryBatch, LogEntryRead
from app.services.log_service import log_service

router = APIRouter()


@router.post('/ingest', status_code=status.HTTP_202_ACCEPTED)
async def ingest_logs(
    payload: LogEntryBatch,
    db: AsyncSession = Depends(get_db),
    _: User | None = Depends(require_api_key_or_user),
) -> dict[str, int]:
    count = await log_service.ingest_batch(db, payload)
    return {'accepted': count}


@router.get('', response_model=list[LogEntryRead])
async def search_logs(
    service_id: str | None = Query(default=None),
    level: str | None = Query(default=None),
    query: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[LogEntryRead]:
    return await log_service.search(db, service_id=service_id, level=level, query=query)
