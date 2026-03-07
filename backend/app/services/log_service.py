from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import LogEntry
from app.schemas.log import LogEntryBatch
from app.services.kafka_service import kafka_service
from app.websocket.manager import websocket_manager


class LogService:
    async def ingest_batch(self, db: AsyncSession, payload: LogEntryBatch) -> int:
        entries = [
            LogEntry(
                service_id=entry.service_id,
                level=entry.level.upper(),
                message=entry.message,
                trace_id=entry.trace_id,
                attributes=entry.attributes,
                recorded_at=entry.recorded_at or datetime.now(timezone.utc),
            )
            for entry in payload.entries
        ]
        db.add_all(entries)
        await db.commit()

        for entry in entries:
            await kafka_service.publish(
                settings.kafka_logs_topic,
                {
                    'service_id': str(entry.service_id),
                    'level': entry.level,
                    'message': entry.message,
                    'trace_id': entry.trace_id,
                    'recorded_at': entry.recorded_at.isoformat(),
                },
            )
            await websocket_manager.broadcast(
                {
                    'type': 'log',
                    'payload': {
                        'service_id': str(entry.service_id),
                        'level': entry.level,
                        'message': entry.message,
                        'trace_id': entry.trace_id,
                        'recorded_at': entry.recorded_at.isoformat(),
                    },
                }
            )
        return len(entries)

    async def search(self, db: AsyncSession, service_id: str | None, level: str | None, query: str | None) -> list[LogEntry]:
        stmt = select(LogEntry).order_by(desc(LogEntry.recorded_at)).limit(200)
        if service_id:
            stmt = stmt.where(LogEntry.service_id == service_id)
        if level:
            stmt = stmt.where(LogEntry.level == level.upper())
        if query:
            stmt = stmt.where(LogEntry.message.ilike(f'%{query}%'))
        result = await db.scalars(stmt)
        return list(result)


log_service = LogService()
