from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import TraceSpan
from app.schemas.trace import TraceBatch, TraceNode, TraceTreeResponse
from app.services.kafka_service import kafka_service


class TraceService:
    async def ingest_batch(self, db: AsyncSession, payload: TraceBatch) -> int:
        spans = [TraceSpan(**span.model_dump()) for span in payload.spans]
        db.add_all(spans)
        await db.commit()
        for span in spans:
            await kafka_service.publish(
                settings.kafka_traces_topic,
                {
                    'trace_id': str(span.trace_id),
                    'span_id': span.span_id,
                    'service_id': str(span.service_id),
                    'operation': span.operation,
                    'duration_ms': span.duration_ms,
                },
            )
        return len(spans)

    async def list_traces(self, db: AsyncSession, service_id: str | None) -> list[TraceSpan]:
        stmt = select(TraceSpan).order_by(desc(TraceSpan.start_time)).limit(100)
        if service_id:
            stmt = stmt.where(TraceSpan.service_id == service_id)
        result = await db.scalars(stmt)
        return list(result)

    async def trace_tree(self, db: AsyncSession, trace_id: str) -> TraceTreeResponse | None:
        spans = list(await db.scalars(select(TraceSpan).where(TraceSpan.trace_id == trace_id).order_by(TraceSpan.start_time.asc())))
        if not spans:
            return None

        nodes = {
            span.span_id: TraceNode(
                span_id=span.span_id,
                parent_span_id=span.parent_span_id,
                service_id=span.service_id,
                operation=span.operation,
                duration_ms=span.duration_ms,
                status_code=span.status_code,
                children=[],
            )
            for span in spans
        }
        roots: list[TraceNode] = []
        for node in nodes.values():
            if node.parent_span_id and node.parent_span_id in nodes:
                nodes[node.parent_span_id].children.append(node)
            else:
                roots.append(node)

        bottleneck = max(spans, key=lambda item: item.duration_ms)
        total_duration = sum(span.duration_ms for span in spans if span.parent_span_id is None) or max(span.duration_ms for span in spans)
        return TraceTreeResponse(
            trace_id=trace_id,
            bottleneck_span_id=bottleneck.span_id,
            total_duration_ms=total_duration,
            roots=roots,
        )


trace_service = TraceService()
