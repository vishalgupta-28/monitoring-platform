from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_api_key_or_user
from app.db.models import User
from app.schemas.trace import TraceBatch, TraceRead, TraceTreeResponse
from app.services.trace_service import trace_service

router = APIRouter()


@router.post('/ingest', status_code=status.HTTP_202_ACCEPTED)
async def ingest_traces(
    payload: TraceBatch,
    db: AsyncSession = Depends(get_db),
    _: User | None = Depends(require_api_key_or_user),
) -> dict[str, int]:
    count = await trace_service.ingest_batch(db, payload)
    return {'accepted': count}


@router.get('', response_model=list[TraceRead])
async def list_traces(
    service_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[TraceRead]:
    return await trace_service.list_traces(db, service_id=service_id)


@router.get('/{trace_id}', response_model=TraceTreeResponse)
async def trace_details(trace_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)) -> TraceTreeResponse:
    trace = await trace_service.trace_tree(db, trace_id)
    if not trace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Trace not found')
    return trace
