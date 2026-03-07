from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AlertEvent, AlertRule, MetricPoint
from app.services.rabbitmq_service import rabbitmq_service
from app.websocket.manager import websocket_manager


class AlertService:
    async def evaluate_metric(self, db: AsyncSession, point: MetricPoint) -> None:
        rules = await db.scalars(
            select(AlertRule).where(
                AlertRule.service_id == point.service_id,
                AlertRule.metric_name == point.metric_name,
                AlertRule.is_active.is_(True),
            )
        )

        for rule in rules:
            breached = self._breached(rule.comparison, point.value, rule.threshold)
            if not breached:
                continue

            duplicate = await db.scalar(
                select(AlertEvent).where(
                    AlertEvent.rule_id == rule.id,
                    AlertEvent.status == 'open',
                    AlertEvent.triggered_at >= datetime.now(timezone.utc) - timedelta(seconds=rule.window_seconds),
                )
            )
            if duplicate:
                continue

            event = AlertEvent(
                rule_id=rule.id,
                service_id=point.service_id,
                metric_name=point.metric_name,
                current_value=point.value,
                message=f'{rule.name}: {point.metric_name} is {point.value:.2f}, threshold {rule.comparison} {rule.threshold:.2f}',
                delivered_channels=rule.channels,
            )
            db.add(event)
            await db.flush()
            await rabbitmq_service.enqueue(
                'alerts.dispatch',
                {
                    'event_id': str(event.id),
                    'channels': rule.channels,
                    'message': event.message,
                    'severity': rule.severity,
                },
            )
            await websocket_manager.broadcast(
                {
                    'type': 'alert',
                    'payload': {
                        'id': str(event.id),
                        'service_id': str(event.service_id),
                        'metric_name': event.metric_name,
                        'current_value': event.current_value,
                        'message': event.message,
                        'severity': rule.severity,
                    },
                }
            )
        await db.commit()

    async def recent_events(self, db: AsyncSession) -> list[AlertEvent]:
        result = await db.scalars(select(AlertEvent).order_by(desc(AlertEvent.triggered_at)).limit(50))
        return list(result)

    @staticmethod
    def _breached(comparison: str, value: float, threshold: float) -> bool:
        return {
            'gt': value > threshold,
            'gte': value >= threshold,
            'lt': value < threshold,
            'lte': value <= threshold,
        }.get(comparison, value > threshold)


alert_service = AlertService()
